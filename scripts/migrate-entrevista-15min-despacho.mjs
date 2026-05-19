#!/usr/bin/env node
// One-shot: agrega la entrevista de 15 minutos ($130k) y la opción de
// "despacho en terreno" (+50%) al blob de tarifas vivo en prod.
//
// Cómo usar:
//   1) Entra a https://radioaraucana.cl/cotiza/admin
//   2) DevTools (F12) → Console → pega:
//        JSON.parse(localStorage['extractos-admin-session']).access_token
//      Copia el string que devuelve.
//   3) ADMIN_JWT="<token>" node scripts/migrate-entrevista-15min-despacho.mjs
//
// Idempotente: no duplica el 15min ni reescribe los flags si ya existen.

const BASE = process.env.API_BASE || "https://radioaraucana.cl";
const JWT = process.env.ADMIN_JWT;

const ENTREVISTA_15MIN = {
  id: "15min",
  label: "Entrevista de 15 minutos",
  precio: 130000,
};
const DESPACHO_FIELDS = {
  permiteDespacho: true,
  recargoDespacho: 0.5,
  despachoLabel: "Despacho en terreno (+50%)",
  despachoDescripcion: "Entrevista realizada desde un lugar fuera de los estudios. Se cobra un 50% adicional sobre el valor base.",
};

if (!JWT) {
  console.error("Falta ADMIN_JWT. Lee las instrucciones al inicio del script.");
  process.exit(1);
}

async function main() {
  console.log(`Leyendo tarifas actuales de ${BASE}/api/cotiza/tarifas ...`);
  const readRes = await fetch(`${BASE}/api/cotiza/tarifas`, { cache: "no-store" });
  if (!readRes.ok) {
    console.error(`Read falló: ${readRes.status} ${readRes.statusText}`);
    process.exit(1);
  }
  const tarifas = await readRes.json();

  const entrevista = (tarifas.formatos || []).find((f) => f.id === "entrevista");
  if (!entrevista) {
    console.error("No se encontró el formato 'entrevista' en el blob actual.");
    process.exit(1);
  }

  let cambios = 0;
  const tiene15 = (entrevista.unidades || []).some((u) => u.id === "15min");
  if (!tiene15) {
    entrevista.unidades.push(ENTREVISTA_15MIN);
    console.log(`  • agregada entrevista 15min ($${ENTREVISTA_15MIN.precio.toLocaleString("es-CL")})`);
    cambios++;
  } else {
    console.log(`  ✓ entrevista 15min ya existe — sin cambios`);
  }

  for (const [k, v] of Object.entries(DESPACHO_FIELDS)) {
    if (entrevista[k] !== v) {
      entrevista[k] = v;
      console.log(`  • set entrevista.${k}`);
      cambios++;
    }
  }

  if (entrevista.duracion === "5 o 10 min") {
    entrevista.duracion = "5, 10 o 15 min";
    console.log(`  • duracion actualizada`);
    cambios++;
  }

  if (cambios === 0) {
    console.log("No hay cambios pendientes. El blob ya está al día.");
    return;
  }

  console.log(`\nGuardando ${cambios} cambio(s) en ${BASE}/api/cotiza/save-tarifas ...`);
  const saveRes = await fetch(`${BASE}/api/cotiza/save-tarifas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT}`,
    },
    body: JSON.stringify(tarifas),
  });
  if (!saveRes.ok) {
    const body = await saveRes.text();
    console.error(`Save falló: ${saveRes.status} ${saveRes.statusText}\n${body}`);
    process.exit(1);
  }
  const out = await saveRes.json();
  console.log(`OK. Guardado el ${out.savedAt}. URL del blob: ${out.url}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
