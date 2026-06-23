// Acceso privado a la presentación de inversión "Araucana Digital".
//
// Una sola función atiende la ruta pública /propuesta (ver rewrite en
// vercel.json):
//   • GET  sin cookie válida  → pantalla de acceso con la marca.
//   • GET  con cookie válida  → la presentación completa.
//   • POST { password }       → valida la clave (timing-safe + rate limit) y,
//                               si es correcta, deja una cookie httpOnly.
//
// La clave vive en la variable de entorno PROPUESTA_PASSWORD (Vercel). El
// contenido nunca se publica como página estática, así que no se puede leer
// por URL directa sin la clave.

import crypto from "node:crypto";
import { rateLimit, tooManyRequests, safeEqual } from "./_lib/security.js";
import PROPUESTA_HTML from "./_lib/propuesta-content.js";

export const config = { runtime: "nodejs" };

const COOKIE_NAME = "propuesta_acceso";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

// Token de sesión determinista derivado de la clave. Va en cookie httpOnly,
// así que no es legible por JS del navegador; basta para reconocer una sesión
// ya autenticada sin guardar la clave en el cliente.
function sessionToken(password) {
  return crypto.createHash("sha256").update(`araucana-propuesta:${password}`).digest("hex");
}

function hasValidCookie(req, password) {
  const raw = req.headers.cookie || "";
  const match = raw.match(/(?:^|;\s*)propuesta_acceso=([^;]+)/);
  if (!match) return false;
  return safeEqual(decodeURIComponent(match[1]), sessionToken(password));
}

export default async function handler(req, res) {
  const password = process.env.PROPUESTA_PASSWORD || "";
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  // ── Intento de acceso ────────────────────────────────────────────────
  if (req.method === "POST") {
    if (!rateLimit(req, { key: "propuesta-login", limit: 8, windowMs: 60_000 })) {
      return tooManyRequests(res);
    }
    if (!password) {
      return res.status(503).json({ ok: false, error: "no_configurado" });
    }
    const intento = req.body && typeof req.body === "object" ? req.body.password : undefined;
    if (!safeEqual(String(intento || ""), password)) {
      return res.status(401).json({ ok: false, error: "clave_incorrecta" });
    }
    res.setHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=${encodeURIComponent(sessionToken(password))}; HttpOnly; Secure; SameSite=Lax; Path=/propuesta; Max-Age=${MAX_AGE}`,
    );
    return res.status(200).json({ ok: true });
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  // ── Página ───────────────────────────────────────────────────────────
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (password && hasValidCookie(req, password)) {
    return res.status(200).send(PROPUESTA_HTML);
  }
  return res.status(200).send(LOGIN_HTML);
}

const LOGIN_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#1A1617">
<title>Acceso privado · Araucana Digital</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{--rojo:#E82329;--rojo-texto:#F04A4F;--rojo-oscuro:#C10F19;--carbon:#1A1617;--carta:#2A2425;--texto:#F2EFEE;--gris:#9B9C9E;--borde:rgba(255,255,255,.1)}
  *{margin:0;padding:0;box-sizing:border-box}
  body{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
    background:var(--carbon);color:var(--texto);font-family:'Open Sans',system-ui,sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased;
    background-image:radial-gradient(820px 420px at 80% -10%,rgba(232,35,41,.16),transparent 60%),radial-gradient(680px 360px at 8% 110%,rgba(91,156,33,.08),transparent 60%)}
  .card{width:100%;max-width:404px;background:var(--carta);border:1px solid var(--borde);border-radius:22px;padding:40px 34px;
    box-shadow:0 30px 80px rgba(0,0,0,.5)}
  .logo{height:42px;width:auto;display:block;margin-bottom:26px}
  .kick{color:var(--rojo-texto);font-weight:800;font-size:11px;letter-spacing:.26em;text-transform:uppercase;margin-bottom:10px}
  h1{font-size:25px;font-weight:800;letter-spacing:-.01em;line-height:1.15;margin-bottom:8px}
  .sub{color:var(--gris);font-size:14px;font-weight:300;margin-bottom:28px}
  label{display:block;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gris);margin-bottom:8px}
  input{width:100%;background:#1f1b1c;border:1px solid var(--borde);border-radius:12px;padding:14px 16px;color:var(--texto);
    font-family:inherit;font-size:16px;transition:border-color .2s ease}
  input:focus{outline:none;border-color:var(--rojo)}
  button{width:100%;margin-top:18px;background:var(--rojo-oscuro);color:#fff;border:none;border-radius:12px;padding:15px;
    font-family:inherit;font-size:15px;font-weight:700;letter-spacing:.02em;cursor:pointer;transition:background .2s ease,transform .1s ease}
  button:hover{background:var(--rojo)}
  button:active{transform:scale(.99)}
  button:disabled{opacity:.6;cursor:progress}
  .err{min-height:20px;margin-top:14px;font-size:13.5px;color:var(--rojo-texto);font-weight:600}
  .pie{margin-top:24px;padding-top:18px;border-top:1px solid var(--borde);font-size:12px;color:var(--gris);font-weight:300}
  .pie b{color:var(--texto);font-weight:600}
</style>
</head>
<body>
  <main class="card">
    <img class="logo" src="/araucana-logo-white.svg" alt="Radio Araucana">
    <div class="kick">Documento privado</div>
    <h1>Propuesta Araucana Digital</h1>
    <p class="sub">Esta presentación es de acceso restringido. Ingresa la clave para verla.</p>
    <form id="f" autocomplete="off">
      <label for="p">Clave de acceso</label>
      <input id="p" name="password" type="password" autocomplete="current-password" autofocus required inputmode="text" enterkeyhint="go">
      <button id="b" type="submit">Entrar</button>
      <div class="err" id="e" role="alert" aria-live="polite"></div>
    </form>
    <p class="pie">Propuesta de inversión · <b>Radio Araucana FM &amp; La Frontera AM</b></p>
  </main>
<script>
(function(){
  var f=document.getElementById('f'),p=document.getElementById('p'),b=document.getElementById('b'),e=document.getElementById('e');
  f.addEventListener('submit',function(ev){
    ev.preventDefault();
    e.textContent='';
    b.disabled=true;b.textContent='Verificando…';
    fetch('/propuesta',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:p.value})})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,status:r.status,j:j};});})
      .then(function(res){
        if(res.ok&&res.j&&res.j.ok){location.reload();return;}
        b.disabled=false;b.textContent='Entrar';
        if(res.status===429){e.textContent='Demasiados intentos. Espera un minuto e intenta de nuevo.';}
        else if(res.status===503){e.textContent='El acceso aún no está configurado. Avísale al equipo.';}
        else{e.textContent='Clave incorrecta. Revisa e intenta otra vez.';}
        p.value='';p.focus();
      })
      .catch(function(){
        b.disabled=false;b.textContent='Entrar';
        e.textContent='No se pudo conectar. Revisa tu internet e intenta de nuevo.';
      });
  });
})();
</script>
</body>
</html>`;
