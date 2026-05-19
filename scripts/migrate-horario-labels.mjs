#!/usr/bin/env node
// One-shot: actualiza los labels de horarios en el blob de tarifas vivo en prod.
//
// Renombra:
//   "Horario Repartido (BASE)"      → "Horario Repartido (aleatorio durante el día)"
//   "Horario Seleccionado (PRIME)"  → "Horario Seleccionado (lo elige el cliente)"
//
// Cómo usar:
//   1) Entra a https://radioaraucana.cl/cotiza/admin
//   2) Abre DevTools (F12) → Console → pega:
//        JSON.parse(localStorage['extractos-admin-session']).access_token
//      Copia el string que devuelve.
//   3) ADMIN_JWT="<token>" node scripts/migrate-horario-labels.mjs
//
// El script:
//   - Lee tarifas actuales desde /api/cotiza/tarifas (público)
//   - Sustituye solo los labels indicados
//   - Reescribe el blob completo vía /api/cotiza/save-tarifas (autenticado)
//
// Es idempotente: corre de nuevo sin efecto si los labels ya están actualizados.

const BASE = process.env.API_BASE || "https://radioaraucana.cl";
const JWT = process.env.ADMIN_JWT;

const RENAMES = [
  { from: "Horario Repartido (BASE)", to: "Horario Repartido (aleatorio durante el día)" },
  { from: "Horario Seleccionado (PRIME)", to: "Horario Seleccionado (lo elige el cliente)" },
];

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

  let cambios = 0;
  for (const formato of tarifas.formatos || []) {
    for (const horario of formato.horarios || []) {
      const match = RENAMES.find((r) => r.from === horario.label);
      if (match) {
        console.log(`  • ${formato.id}/${horario.id}: "${horario.label}" → "${match.to}"`);
        horario.label = match.to;
        cambios++;
      }
    }
  }

  if (cambios === 0) {
    console.log("No hay labels que actualizar. El blob ya está al día.");
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
