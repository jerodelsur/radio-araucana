// Genera api/_lib/propuesta-content.js a partir del archivo de diseño
// propuesta-araucana-digital.html, que es la única fuente de verdad del
// contenido de la presentación.
//
// La función serverless /api/propuesta sirve ese HTML solo a quien tiene la
// cookie de acceso válida, así que el contenido NO se publica como página
// estática y no se puede leer por URL directa.
//
// Uso:  node scripts/build-propuesta-content.mjs
// Reejecutar cada vez que se edite propuesta-araucana-digital.html.

import { readFileSync, writeFileSync } from "node:fs";

const src = new URL("../propuesta-araucana-digital.html", import.meta.url);
const out = new URL("../api/_lib/propuesta-content.js", import.meta.url);

const html = readFileSync(src, "utf8");

const banner =
  "// ⚠️ Archivo generado por scripts/build-propuesta-content.mjs — NO editar a mano.\n" +
  "// Fuente: propuesta-araucana-digital.html\n" +
  "// Reejecutar el script tras cualquier cambio de contenido.\n\n";

writeFileSync(out, `${banner}export default ${JSON.stringify(html)};\n`, "utf8");

console.log(`propuesta-content.js generado (${html.length} bytes de HTML).`);
