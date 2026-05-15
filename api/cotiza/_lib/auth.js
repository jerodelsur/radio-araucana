// Helper compartido: valida Bearer ADMIN_PASSWORD con tolerancia a whitespace.
//
// Razón del trim: cuando se setea ADMIN_PASSWORD en el dashboard de Vercel a
// veces se cuelan newlines o espacios al pegar. Eso hace que `req.token === expected`
// nunca matchee aunque la clave sea "correcta" visualmente. Comparar trim()
// evita ese fallo silencioso.

export function authOk(req) {
  const expected = (process.env.ADMIN_PASSWORD || "").trim();
  if (!expected) return false;
  const header = req.headers.authorization || "";
  const [scheme, ...rest] = header.split(" ");
  const token = rest.join(" ").trim();
  return scheme === "Bearer" && token === expected;
}
