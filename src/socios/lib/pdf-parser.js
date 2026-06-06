// Parser de documentos SII para el panel de socios.
// Detecta el tipo de documento (Libro de Ventas, Compras, Remuneraciones, Honorarios, F29)
// y extrae los totales relevantes para pre-llenar el formulario de reporte mensual.

let _pdfjs = null;

async function getPDFJS() {
  if (_pdfjs) return _pdfjs;
  const pdfjs = await import("pdfjs-dist");
  // Apunta el worker al archivo en node_modules vía Vite ?url
  const workerUrl = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.toString();
  _pdfjs = pdfjs;
  return _pdfjs;
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

/** Extrae todo el texto de un PDF como un solo string */
async function extraerTexto(file) {
  const pdfjs = await getPDFJS();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  let texto = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    texto += content.items.map((item) => item.str).join(" ") + "\n";
  }
  return texto;
}

/** Convierte número chileno (1.234.567) a integer */
function parseCLP(str) {
  if (!str) return 0;
  return parseInt(str.replace(/\./g, "").replace(",", ""), 10) || 0;
}

/** Detecta el tipo de documento SII por palabras clave en el texto */
function detectarTipo(texto) {
  if (/LIBRO\s+DE\s+VENTAS/i.test(texto)) return "ventas";
  if (/LIBRO\s+DE\s+COMPRAS/i.test(texto)) return "compras";
  if (/LIBRO\s+DE\s+REMUNERACIONES/i.test(texto)) return "remuneraciones";
  if (/LIBRO\s+DE\s+HONORARIOS/i.test(texto)) return "honorarios";
  if (/DÉBITOS\s+y\s+VENTAS|Impuestos\s+Mensuales|F-?29/i.test(texto)) return "f29";
  return "desconocido";
}

// ─── Parsers por tipo de documento ───────────────────────────────────────────

/**
 * LIBRO DE VENTAS
 * Extrae el Neto total de la página TOTALES.
 * Estructura: "Totales 0 16.049.966 3.049.491 0 19.099.457"
 *              Exento  Neto        IVA         Imp  Total
 */
function parsearVentas(texto) {
  // La página 2 tiene: "Totales 0 16.049.966 ..."
  const match = texto.match(/Totales\s+0\s+([\d\.]+)\s+[\d\.]+\s+0\s+[\d\.]+/);
  if (!match) {
    // Fallback: toma el neto del último "Total N Factura Electrónica"
    const m2 = texto.match(/Total\s+\d+\s+Factura\s+Electr[oó]nica\s+0\s+([\d\.]+)/);
    if (m2) {
      return { tipo: "ventas", neto: parseCLP(m2[1]), ok: true };
    }
    return { tipo: "ventas", ok: false, error: "No se encontró la fila de Totales" };
  }
  return { tipo: "ventas", neto: parseCLP(match[1]), ok: true };
}

/**
 * LIBRO DE COMPRAS
 * Extrae del RESUMEN:
 * - Factura 33 (afectas con IVA) → Neto = gastos_proveedores
 * - Factura 34 (exentas, sin IVA) → Exento = gastos_honorarios (contador, asesorías empresa)
 * - Nota de Crédito 61 → Neto negativo (se resta de proveedores)
 * Estructura RESUMEN: "Tipo (NN) Cantidad Exento Neto IVA_recup IVA_no_recup Uso_común Imp. Total"
 */
function parsearCompras(texto) {
  const items = [];

  // Factura Electrónica 33: "Factura Electrónica (33) 9 9.612 1.668.678 317.051 0 0 0 1.994.761"
  // Columnas: cantidad, exento, neto (el neto es lo que nos importa como gasto)
  const m33 = texto.match(
    /Factura\s+Electr[oó]nica\s+\(33\)\s+\d+\s+([\d\.]+)\s+([\d\.]+)/
  );
  if (m33) {
    const neto = parseCLP(m33[2]);
    if (neto > 0) {
      items.push({
        label: "Facturas afectas (proveedores con IVA)",
        campo: "gastos_proveedores",
        monto: neto,
        signo: 1,
      });
    }
  }

  // Factura no Afecta/Exenta 34: "Factura no Afecta o Exenta Electrónica (34) 2 1.295.970 0 ..."
  // El monto va en la columna Exento (sin IVA) — típicamente contador, asesorías legales
  const m34 = texto.match(
    /Factura\s+no\s+Afecta[^\n]+?\(34\)\s+\d+\s+([\d\.]+)/
  );
  if (m34) {
    const monto = parseCLP(m34[1]);
    if (monto > 0) {
      items.push({
        label: "Facturas exentas (contador, asesorías empresa)",
        campo: "gastos_honorarios",
        monto,
        signo: 1,
      });
    }
  }

  // Nota de Crédito 61: "Nota de Crédito Electrónica (61) 1 0 1.100.000 ..."
  // Se resta de proveedores (fue una devolución de compra)
  const m61 = texto.match(
    /Nota\s+de\s+Cr[eé]dito\s+Electr[oó]nica\s+\(61\)\s+\d+\s+0\s+([\d\.]+)/
  );
  if (m61) {
    const monto = parseCLP(m61[1]);
    if (monto > 0) {
      items.push({
        label: "Notas de crédito recibidas (descuento a proveedores)",
        campo: "gastos_proveedores",
        monto,
        signo: -1,
      });
    }
  }

  return {
    tipo: "compras",
    items,
    ok: items.length > 0,
    error: items.length === 0 ? "No se encontraron totales en el RESUMEN" : null,
  };
}

/**
 * LIBRO DE REMUNERACIONES
 * Extrae el Líquido total (lo que realmente se pagó a empleados).
 * Estructura: "(N Funcionarios) ... [varios números] ... 1.109.310"
 * El Líquido es el ÚLTIMO número de la fila de Funcionarios.
 */
function parsearRemuneraciones(texto) {
  // Busca la sección después de "Funcionarios)"
  const match = texto.match(/\(\d+\s+Funcionarios?\)([\s\d\.]+)/i);
  if (!match) {
    return { tipo: "remuneraciones", ok: false, error: "No se encontró la fila de Funcionarios" };
  }

  // Extraer todos los números de ese bloque
  const numeros = (match[1].match(/[\d\.]+/g) || [])
    .filter((n) => n.length >= 4); // descartar números muy cortos (0, %)

  if (numeros.length === 0) {
    return { tipo: "remuneraciones", ok: false, error: "No se pudieron extraer los montos" };
  }

  const liquido = parseCLP(numeros[numeros.length - 1]);
  // El Total Haber suele ser el 5° número de la fila
  const totalHaber = numeros.length >= 5 ? parseCLP(numeros[4]) : liquido;

  return {
    tipo: "remuneraciones",
    liquido,
    totalHaber,
    ok: liquido > 0,
    error: liquido === 0 ? "El líquido calculado es $0, revisa el PDF" : null,
  };
}

/**
 * LIBRO DE HONORARIOS (boletas de trabajadores independientes)
 * Extrae el total de honorarios pagados.
 */
function parsearHonorarios(texto) {
  // Busca "Total" seguido de un monto grande
  const match = texto.match(/[Tt]otales?\s+([\d\.]{6,})/);
  if (!match) {
    return { tipo: "honorarios", ok: false, error: "No se encontró el total de honorarios" };
  }
  return {
    tipo: "honorarios",
    total: parseCLP(match[1]),
    ok: true,
  };
}

/**
 * F29 — Solo referencia, no mapeamos a campos del formulario.
 * Adjuntamos como documento de respaldo.
 */
function parsearF29(texto) {
  // Extrae Total a pagar (línea 147) y PPM (línea 69)
  const matchPagar = texto.match(/TOTAL A PAGAR DENTRO DEL PLAZO LEGAL[^\d]+([\d\.]+)/i);
  const matchPPM = texto.match(/PPM Neto Determinado[\s\S]{0,50}?([\d\.]{4,})/i);

  return {
    tipo: "f29",
    ok: true,
    soloReferencia: true,
    totalPagar: matchPagar ? parseCLP(matchPagar[1]) : null,
    ppm: matchPPM ? parseCLP(matchPPM[1]) : null,
  };
}

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Procesa un archivo PDF y devuelve el resultado parseado.
 * @param {File} file — Archivo PDF del SII
 * @returns {Promise<Object>} — Resultado con tipo, valores y estado
 */
export async function procesarPDF(file) {
  try {
    const texto = await extraerTexto(file);
    const tipo = detectarTipo(texto);

    switch (tipo) {
      case "ventas":        return parsearVentas(texto);
      case "compras":       return parsearCompras(texto);
      case "remuneraciones": return parsearRemuneraciones(texto);
      case "honorarios":    return parsearHonorarios(texto);
      case "f29":           return parsearF29(texto);
      default:
        return {
          tipo: "desconocido",
          ok: false,
          error: "No se reconoció el tipo de documento SII",
        };
    }
  } catch (err) {
    return {
      tipo: "error",
      ok: false,
      error: err?.message || "Error al procesar el PDF",
    };
  }
}

/**
 * Calcula los valores del formulario a partir de los resultados de múltiples PDFs.
 * Suma ítems del mismo campo (ej: varias fuentes de gastos_proveedores).
 */
export function calcularValoresFormulario(resultados) {
  const valores = {};

  for (const r of resultados) {
    if (!r?.ok || r.soloReferencia) continue;

    if (r.tipo === "ventas") {
      valores.ingresos = r.neto;
    }

    if (r.tipo === "compras" && Array.isArray(r.items)) {
      for (const item of r.items) {
        const actual = valores[item.campo] || 0;
        valores[item.campo] = actual + item.monto * item.signo;
        // Nunca negativo
        if (valores[item.campo] < 0) valores[item.campo] = 0;
      }
    }

    if (r.tipo === "remuneraciones") {
      valores.gastos_sueldos = r.liquido;
    }

    if (r.tipo === "honorarios") {
      valores.gastos_honorarios = (valores.gastos_honorarios || 0) + r.total;
    }
  }

  return valores;
}

/** Labels amigables por tipo de documento */
export const TIPO_LABELS = {
  ventas: "Libro de Ventas",
  compras: "Libro de Compras",
  remuneraciones: "Libro de Remuneraciones",
  honorarios: "Libro de Honorarios",
  f29: "Formulario F29",
  desconocido: "Documento no reconocido",
  error: "Error al procesar",
};

/** Íconos emoji por tipo */
export const TIPO_ICONOS = {
  ventas: "📈",
  compras: "🛒",
  remuneraciones: "👥",
  honorarios: "📋",
  f29: "🏛️",
  desconocido: "❓",
  error: "⚠️",
};
