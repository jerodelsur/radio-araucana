// POST: valida la clave de admin contra ADMIN_PASSWORD. Devuelve 200 si
// es correcta, 401 si no. El cliente lo usa para validar al hacer login
// (antes solo guardábamos la clave en sessionStorage sin verificar, y el
// error 401 aparecía recién al cargar datos).

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const expected = (process.env.ADMIN_PASSWORD || "").trim();
  if (!expected) {
    return res.status(503).json({
      error: "admin_password_not_configured",
      message: "Falta configurar ADMIN_PASSWORD en Vercel.",
    });
  }

  const password = typeof req.body?.password === "string" ? req.body.password.trim() : "";
  if (!password) return res.status(400).json({ error: "Falta el campo password" });

  if (password !== expected) {
    // Pequeño delay para mitigar fuerza bruta
    await new Promise((resolve) => setTimeout(resolve, 300));
    return res.status(401).json({ error: "Clave incorrecta" });
  }

  return res.status(200).json({ ok: true });
}
