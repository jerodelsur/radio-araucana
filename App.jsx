import { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { Menu, X, Play, Pause, Volume2, VolumeX, Share2, ChevronDown, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import defaultContent from "./src/content/site.json";

/* ─── Editable content ──────────────────────────────────────────────────────
   Runtime content is fetched from /api/content (which reads from Vercel Blob
   and falls back to the bundled defaults). The /admin panel writes to the
   same Blob via /api/admin/save. To change the *shape* of content, edit
   src/content/site.json (defaults) and the corresponding field rendering
   here in App.jsx. ────────────────────────────────────────────────────────── */
const SiteContentContext = createContext(defaultContent);
const useSiteContent = () => useContext(SiteContentContext);

/* ─── Social ──────────────────────────────────────────────────────────────── */
const SvgInstagram = ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>;
const SvgYoutube  = ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
const SvgFacebook = ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;

// URLs oficiales de redes sociales (footer, hero, bloque "Síguenos" y sameAs en JSON-LD).
const SOC_LINKS = [
  { key: "youtube",   label: "YouTube",   handle: "@araucanafm",    cta: "Suscribirse", href: "https://www.youtube.com/@araucanafm?sub_confirmation=1", Icon: SvgYoutube,   what: "Podcast, entrevistas completas y shorts" },
  { key: "instagram", label: "Instagram", handle: "@araucanaradio", cta: "Seguir",      href: "https://www.instagram.com/araucanaradio", Icon: SvgInstagram, what: "Reels, fotos del estudio y avisos del día" },
  { key: "facebook",  label: "Facebook",  handle: "Radio Araucana", cta: "Seguir",      href: "https://www.facebook.com/share/1aK6itN6zP/?mibextid=wwXIfr", Icon: SvgFacebook, what: "Noticias regionales y transmisiones" },
];
const YT_CHANNEL = "https://www.youtube.com/@araucanafm";

/* ─── Official brand logo SVG (from araucanayfrontera.cl) ─────────────────── */
const LogoSVG = ({ height = 40, color = "#ffffff" }) => (
  <svg
    height={height}
    viewBox="0 0 600 274.21"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "block" }}
    aria-hidden="true"
    focusable="false"
  >
    <g>
      <g>
        <g>
          <path d="M5.43,45.99h37.15c8.43,0,14.79,2.29,19.07,6.88c4.29,4.59,6.43,10.76,6.43,18.52c0,4.73-1.18,8.93-3.55,12.59c-2.37,3.66-5.58,6.49-9.65,8.48c0.81,0.67,1.51,1.44,2.11,2.33c0.59,0.89,1.26,2.18,2,3.88l8.21,18.74H45.46l-7.54-17.19c-0.59-1.33-1.31-2.27-2.16-2.83c-0.85-0.55-2.05-0.83-3.6-0.83h-5.88v20.85H5.43V45.99z M37.25,80.59c3.03,0,5.38-0.79,7.04-2.38c1.66-1.59,2.49-3.86,2.49-6.82c0-6.28-2.96-9.43-8.87-9.43H26.27v18.63H37.25z"/>
          <path d="M99.01,45.99h22.07l27.39,71.42h-21.74l-5.99-15.19H99.23l-5.88,15.19H71.62L99.01,45.99z M117.97,87.25l-7.98-20.96L102,87.25H117.97z"/>
          <path d="M153.49,45.99h31.94c11.38,0,20.02,2.87,25.89,8.59c5.88,5.73,8.82,14.92,8.82,27.56c0,12.05-2.94,20.94-8.82,26.67c-5.88,5.73-14.51,8.59-25.89,8.59h-31.94V45.99z M182.77,101.44c3.7,0,6.69-0.54,8.98-1.61c2.29-1.07,4.05-2.99,5.27-5.77c1.22-2.77,1.83-6.75,1.83-11.92c0-5.25-0.55-9.33-1.66-12.25c-1.11-2.92-2.83-4.97-5.16-6.15c-2.33-1.18-5.42-1.77-9.26-1.77h-8.43v39.48H182.77z"/>
          <path d="M226.7,45.99h20.85v71.42H226.7V45.99z"/>
          <path d="M263.57,109.7c-6.14-5.88-9.2-15.14-9.2-27.78c0-13.01,3.05-22.44,9.15-28.28c6.1-5.84,15.21-8.76,27.34-8.76c12.12,0,21.24,2.94,27.34,8.82c6.1,5.88,9.15,15.29,9.15,28.22c0,12.57-3.07,21.81-9.2,27.72c-6.14,5.92-15.23,8.87-27.28,8.87C278.79,118.52,269.7,115.58,263.57,109.7z M302.43,96.29c2.4-2.99,3.6-7.78,3.6-14.36c0-6.95-1.18-11.9-3.55-14.86c-2.37-2.96-6.25-4.44-11.64-4.44c-5.4,0-9.28,1.48-11.64,4.44c-2.37,2.96-3.55,7.91-3.55,14.86c0,6.58,1.2,11.37,3.6,14.36c2.4,2.99,6.27,4.49,11.59,4.49C296.17,100.78,300.03,99.28,302.43,96.29z"/>
          <path d="M30.6,122.04h22.07l27.39,71.42H58.32l-5.99-15.19H30.82l-5.88,15.19H3.21L30.6,122.04z M49.56,163.29l-7.98-20.96l-7.98,20.96H49.56z"/>
          <path d="M85.08,122.04h37.15c8.43,0,14.79,2.29,19.07,6.88c4.29,4.59,6.43,10.76,6.43,18.52c0,4.73-1.18,8.93-3.55,12.59c-2.37,3.66-5.58,6.49-9.65,8.48c0.81,0.67,1.51,1.44,2.11,2.33c0.59,0.89,1.26,2.18,2,3.88l8.21,18.74h-21.74l-7.54-17.19c-0.59-1.33-1.31-2.27-2.16-2.83c-0.85-0.55-2.05-0.83-3.6-0.83h-5.88v20.85H85.08V122.04z M116.91,156.64c3.03,0,5.38-0.79,7.04-2.38c1.66-1.59,2.49-3.86,2.49-6.82c0-6.28-2.96-9.43-8.87-9.43h-11.64v18.63H116.91z"/>
          <path d="M178.67,122.04h22.07l27.39,71.42h-21.74l-5.99-15.19h-21.51l-5.88,15.19h-21.74L178.67,122.04z M197.63,163.29l-7.98-20.96l-7.98,20.96H197.63z"/>
          <path d="M238.13,187.08c-6.17-4.99-9.26-12.03-9.26-21.13v-43.91h20.85v41.7c0,8.72,4.33,13.09,12.98,13.09c8.58,0,12.86-4.36,12.86-13.09v-41.7h20.85v43.91c0,6.06-1.41,11.24-4.21,15.53c-2.81,4.29-6.76,7.54-11.87,9.76c-5.1,2.22-10.98,3.33-17.63,3.33C252.49,194.56,244.3,192.07,238.13,187.08z"/>
          <path d="M312.16,185.08c-6.8-6.32-10.2-15.32-10.2-27c0-12.05,3.34-21.25,10.04-27.61c6.69-6.36,16.58-9.54,29.66-9.54c4.21,0,8.04,0.32,11.48,0.94c3.44,0.63,6.89,1.57,10.37,2.83v18.19c-6.36-2.81-13.16-4.21-20.4-4.21c-6.8,0-11.81,1.55-15.03,4.66c-3.22,3.11-4.82,8.02-4.82,14.75c0,6.51,1.68,11.26,5.05,14.25c3.36,2.99,8.37,4.49,15.03,4.49c7.32,0,14.12-1.37,20.4-4.1v18.3c-6.88,2.37-14.19,3.55-21.96,3.55C328.83,194.56,318.96,191.4,312.16,185.08z"/>
          <path d="M394.9,122.04h22.07l27.39,71.42h-21.74l-5.99-15.19h-21.51l-5.88,15.19h-21.74L394.9,122.04z M413.86,163.29l-7.98-20.96l-7.98,20.96H413.86z"/>
          <path d="M449.38,122.04h17.74l26.95,37.82v-37.82h20.85v71.42h-17.85l-26.84-37.7v37.7h-20.85V122.04z"/>
          <path d="M547.33,122.04h22.07l27.39,71.42h-21.74l-5.99-15.19h-21.51l-5.88,15.19h-21.74L547.33,122.04z M566.3,163.29l-7.98-20.96l-7.98,20.96H566.3z"/>
          <path d="M5.43,198.08H59.1v15.53H26.27v12.31h28.61v15.75H26.27v27.83H5.43V198.08z"/>
          <path d="M63.4,198.08H83.7l17.74,36.26l17.63-36.26h20.18v71.42h-20.85v-35.71l-11.42,23.51h-11.2l-11.53-23.51v35.71H63.4V198.08z"/>
          <path d="M161.05,269.99c-2.88-0.41-5.69-1.13-8.43-2.16v-16.19c2.51,1.11,5.12,1.89,7.82,2.33c2.7,0.44,5.75,0.67,9.15,0.67c5.25,0,9.26-1,12.03-2.99c2.77-2,4.16-4.51,4.16-7.54v-2.11c-1.85,1.18-4.18,2.15-6.99,2.88c-2.81,0.74-5.47,1.11-7.98,1.11c-8.65,0-15.03-2.01-19.13-6.04c-4.1-4.03-6.15-9.96-6.15-17.8c0-7.76,2.4-13.9,7.21-18.41c4.8-4.51,12.31-6.76,22.51-6.76c10.28,0,17.85,2.4,22.73,7.21c4.88,4.81,7.32,12.05,7.32,21.74v13.75c0,5.99-1.35,11.31-4.05,15.97c-2.7,4.66-6.6,8.32-11.7,10.98c-5.1,2.66-11.09,3.99-17.96,3.99C167.45,270.6,163.94,270.4,161.05,269.99z M185.78,227.69v-5.1c0-3.77-0.87-6.52-2.61-8.26c-1.74-1.74-4.45-2.61-8.15-2.61c-3.55,0-6.25,0.83-8.1,2.49c-1.85,1.66-2.77,4.05-2.77,7.15c0,3.25,0.81,5.69,2.44,7.32c1.63,1.63,4.36,2.44,8.21,2.44C178.28,231.13,181.94,229.98,185.78,227.69z"/>
          <path d="M300.35,269.99c-2.88-0.41-5.69-1.13-8.43-2.16v-16.19c2.51,1.11,5.12,1.89,7.82,2.33c2.7,0.44,5.75,0.67,9.15,0.67c5.25,0,9.26-1,12.03-2.99c2.77-2,4.16-4.51,4.16-7.54v-2.11c-1.85,1.18-4.18,2.15-6.99,2.88c-2.81,0.74-5.47,1.11-7.98,1.11c-8.65,0-15.03-2.01-19.13-6.04c-4.1-4.03-6.15-9.96-6.15-17.8c0-7.76,2.4-13.9,7.21-18.41c4.8-4.51,12.31-6.76,22.51-6.76c10.28,0,17.85,2.4,22.73,7.21c4.88,4.81,7.32,12.05,7.32,21.74v13.75c0,5.99-1.35,11.31-4.05,15.97c-2.7,4.66-6.6,8.32-11.7,10.98c-5.1,2.66-11.09,3.99-17.96,3.99C306.74,270.6,303.23,270.4,300.35,269.99z M325.08,227.69v-5.1c0-3.77-0.87-6.52-2.61-8.26c-1.74-1.74-4.45-2.61-8.15-2.61c-3.55,0-6.25,0.83-8.1,2.49c-1.85,1.66-2.77,4.05-2.77,7.15c0,3.25,0.81,5.69,2.44,7.32c1.63,1.63,4.36,2.44,8.21,2.44C317.57,231.13,321.23,229.98,325.08,227.69z"/>
          <path d="M221.85,269.66c-4.32-0.63-7.86-1.57-10.59-2.83v-16.75c2.44,1.18,5.56,2.13,9.37,2.83c3.81,0.7,7.08,1.05,9.81,1.05c4.06,0,7.04-0.63,8.93-1.89c1.89-1.26,2.83-3.25,2.83-5.99c0-2.59-0.7-4.45-2.11-5.6c-1.41-1.14-3.88-1.72-7.43-1.72h-21.74v-9.54l1.89-31.16h46.24l-1.44,15.97h-26.95l-0.67,10.2h8.1c16.93,0,25.39,7.54,25.39,22.62c0,7.32-2.53,13.1-7.6,17.36c-5.06,4.25-12.44,6.38-22.12,6.38C230.14,270.6,226.17,270.29,221.85,269.66z"/>
          <path d="M268.41,254.52h16.41v14.97h-16.41V254.52z"/>
        </g>
      </g>
      {/* Signal wave arcs */}
      <g>
        <path d="M549.22,15.66c-0.22,3.39-1.68,6.56-4.12,8.75c-12.17,10.93-25.76,20.18-40.11,26.96l-0.73,0.25c-17.3,8.3-35.71,13.37-54.88,14.95V42.5c10.17-0.79,19.87-2.69,29.12-5.7c19.2-6.31,37.2-16.54,52.98-30.86c4.4-3.64,10.46-3.64,14.1,0.47C548.01,9.07,549.22,12.24,549.22,15.66z"/>
        <path d="M563.57,58.91c-1.93,1.71-3.64,3.42-5.58,4.88c-31.68,27.12-69.07,42.84-108.61,45.56V85.52c28.9-2.41,57.29-12.58,82.09-30c6.34-4.37,12.42-9.25,18.25-14.58c2.19-2.22,5.35-3.17,8.02-2.69c2.44,0.25,4.63,1.46,6.34,3.42h0.22l0.98,1.2C568.45,48.23,567.72,55.26,563.57,58.91z"/>
        <path d="M579.38,99.02c-7.76,6.81-15.81,13.02-24.11,18.6h-50.03c21.74-8.49,42.2-21.1,60.77-37.55c2.66-2.19,5.83-2.91,9-2.19c2.92,0.73,5.58,3.14,7.03,6.08l0.51,0.48v0.95C584.23,90.28,583.02,95.63,579.38,99.02z"/>
      </g>
    </g>
  </svg>
);

/* ─── Global Styles ───────────────────────────────────────────────────────── */
// Sistema visual: fondo entintado (nunca negro puro), crema como texto,
// verde araucaria como acento y el rojo solo para "en vivo". El mosaico verde
// de los contenidos digitales (thumbnails de YouTube) vuelve como textura.
const GlobalStyles = () => (
  <style>{`
    :root {
      --ink: #191919;
      --ink-2: #111311;
      --ink-3: #1f221f;
      --surface: #242724;
      --line: rgba(246,243,238,0.10);
      --line-strong: rgba(246,243,238,0.18);
      --cream: #F6F3EE;
      --cream-70: rgba(246,243,238,0.72);
      --cream-55: rgba(246,243,238,0.58);
      --green: #52B870;
      --green-deep: #29623A;
      --lime: #B4E356;
      --red: #D7261E;
      --font: 'Open Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      --ease: cubic-bezier(.22,1,.36,1);
      --container: 1240px;
      --gutter: clamp(20px, 4vw, 44px);
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; background: var(--ink); overscroll-behavior-y: none; -webkit-text-size-adjust: 100%; }
    body { font-family: var(--font); background: var(--ink); color: var(--cream); overscroll-behavior-y: none; -webkit-font-smoothing: antialiased; }
    img, svg, video { display: block; max-width: 100%; }
    button, a { font-family: inherit; }
    section[id], footer[id], div[id] { scroll-margin-top: 84px; }
    h1, h2, h3 { text-wrap: balance; }
    p { text-wrap: pretty; }

    :focus { outline: none; }
    :focus-visible { outline: 3px solid var(--lime); outline-offset: 3px; border-radius: 4px; }

    .skip-link { position: absolute; left: 16px; top: -60px; z-index: 20000; background: var(--lime); color: #111; font-weight: 700; padding: 12px 18px; border-radius: 6px; text-decoration: none; transition: top 160ms var(--ease); }
    .skip-link:focus { top: 16px; }

    .container { max-width: var(--container); margin: 0 auto; padding-left: var(--gutter); padding-right: var(--gutter); width: 100%; }
    .kicker { display: inline-flex; align-items: center; gap: 10px; font-weight: 700; font-size: 12px; letter-spacing: .22em; text-transform: uppercase; color: var(--green); }
    .kicker::before { content: ''; width: 22px; height: 2px; background: var(--green); }
    .h2 { font-weight: 800; font-size: clamp(30px, 4.2vw, 52px); line-height: 1.02; letter-spacing: -0.025em; color: var(--cream); }
    .lede { font-weight: 400; font-size: clamp(15px, 1.4vw, 18px); line-height: 1.6; color: var(--cream-70); max-width: 58ch; }
    .meta { font-weight: 600; font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: var(--cream-55); font-variant-numeric: tabular-nums; }

    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 48px; padding: 0 22px; border-radius: 999px; font-weight: 700; font-size: 14px; letter-spacing: .02em; text-decoration: none; cursor: pointer; border: 1px solid transparent; transition: transform 160ms var(--ease), background 160ms var(--ease), color 160ms var(--ease), border-color 160ms var(--ease), box-shadow 160ms var(--ease); white-space: nowrap; }
    .btn:active { transform: translateY(1px) scale(.99); }
    .btn-red { background: var(--red); color: #fff; box-shadow: 0 10px 30px rgba(215,38,30,.28); }
    .btn-red:hover { background: #ee3b33; transform: translateY(-1px); box-shadow: 0 14px 34px rgba(215,38,30,.36); }
    .btn-cream { background: var(--cream); color: #131413; }
    .btn-cream:hover { background: #fff; transform: translateY(-1px); }
    .btn-ghost { background: rgba(246,243,238,.04); color: var(--cream); border-color: var(--line-strong); }
    .btn-ghost:hover { background: rgba(246,243,238,.09); border-color: rgba(246,243,238,.32); transform: translateY(-1px); }
    .btn-green { background: var(--green); color: #0f1a12; }
    .btn-green:hover { background: #63c67f; transform: translateY(-1px); }
    .btn-sm { min-height: 44px; padding: 0 16px; font-size: 13px; }
    .icon-btn { width: 44px; height: 44px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: transparent; border: 1px solid var(--line-strong); color: var(--cream); cursor: pointer; transition: background 160ms var(--ease), border-color 160ms var(--ease), transform 160ms var(--ease); text-decoration: none; }
    .icon-btn:hover { background: rgba(246,243,238,.08); border-color: rgba(246,243,238,.32); }
    .icon-btn:active { transform: scale(.96); }
    .icon-btn[disabled] { opacity: .35; cursor: default; }

    /* Header */
    .site-header { position: sticky; top: 0; z-index: 1000; background: rgba(25,25,25,.78); backdrop-filter: blur(14px) saturate(1.2); -webkit-backdrop-filter: blur(14px) saturate(1.2); border-bottom: 1px solid var(--line); }
    .nav-link { display: inline-flex; align-items: center; min-height: 44px; padding: 0 12px; border-radius: 8px; font-weight: 600; font-size: 14px; color: var(--cream-70); text-decoration: none; transition: color 150ms var(--ease), background 150ms var(--ease); }
    .nav-link:hover { color: var(--cream); background: rgba(246,243,238,.06); }
    .nav-link[aria-current="true"] { color: var(--cream); }
    .live-pill { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 14px 0 12px; border-radius: 999px; background: var(--red); color: #fff; font-weight: 800; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; border: none; cursor: pointer; transition: background 150ms var(--ease), transform 150ms var(--ease); }
    .live-pill:hover { background: #ee3b33; }
    .live-pill:active { transform: scale(.97); }
    .mobile-menu a { display: flex; align-items: center; justify-content: space-between; min-height: 52px; font-weight: 600; font-size: 17px; color: var(--cream); text-decoration: none; border-bottom: 1px solid var(--line); }

    /* Animations */
    @keyframes livePulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: .55; } }
    @keyframes waveform { from { transform: scaleY(0.25); } to { transform: scaleY(1); } }
    @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes signalRing { 0% { transform: scale(0.4); opacity: 0.7; } 100% { transform: scale(2.6); opacity: 0; } }
    @keyframes shimmer { from { background-position: -600px 0; } to { background-position: 600px 0; } }
    @keyframes driftMosaic { from { background-position: 0 0; } to { background-position: -96px 48px; } }

    .live-dot { animation: livePulse 1.6s ease-in-out infinite; }
    .wave-bar { animation: waveform 0.8s ease-in-out alternate infinite; transform-origin: bottom; }
    .marquee-track { animation: marquee 34s linear infinite; white-space: nowrap; display: inline-block; }
    .marquee:hover .marquee-track, .marquee:focus-within .marquee-track { animation-play-state: paused; }
    .fiu-0 { animation: fadeInUp .7s var(--ease) forwards 0s; opacity: 0; }
    .fiu-1 { animation: fadeInUp .7s var(--ease) forwards .12s; opacity: 0; }
    .fiu-2 { animation: fadeInUp .7s var(--ease) forwards .24s; opacity: 0; }
    .fiu-3 { animation: fadeInUp .7s var(--ease) forwards .36s; opacity: 0; }
    .fiu-4 { animation: fadeInUp .8s var(--ease) forwards .3s; opacity: 0; }
    .reveal { opacity: 0; transform: translateY(22px); transition: opacity .8s var(--ease), transform .8s var(--ease); }
    .reveal.in { opacity: 1; transform: none; }
    .mosaic-drift { animation: driftMosaic 40s linear infinite alternate; }
    .skeleton { background: linear-gradient(90deg, rgba(246,243,238,.05) 0%, rgba(246,243,238,.11) 50%, rgba(246,243,238,.05) 100%); background-size: 1200px 100%; animation: shimmer 1.6s linear infinite; border-radius: 10px; }

    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
      .live-dot, .wave-bar, .marquee-track, .mosaic-drift, .skeleton { animation: none; }
      .fiu-0, .fiu-1, .fiu-2, .fiu-3, .fiu-4 { animation: none; opacity: 1; }
      .reveal { opacity: 1; transform: none; transition: none; }
      *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }

    /* Cards */
    .ep-card { display: grid; grid-template-columns: 148px 1fr; gap: 16px; align-items: center; padding: 14px; border-radius: 14px; text-decoration: none; color: inherit; background: transparent; border: 1px solid transparent; transition: background 180ms var(--ease), border-color 180ms var(--ease), transform 180ms var(--ease); text-align: left; width: 100%; cursor: pointer; }
    .ep-card:hover { background: rgba(246,243,238,.05); border-color: var(--line); transform: translateX(3px); }
    .ep-card .thumb { position: relative; aspect-ratio: 16/9; border-radius: 8px; overflow: hidden; background: #0e1a12; }
    .ep-card .thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s var(--ease); }
    .ep-card:hover .thumb img { transform: scale(1.05); }
    @media (max-width: 480px) { .ep-card { grid-template-columns: 112px 1fr; gap: 12px; padding: 10px; } }

    .feature-card { position: relative; display: block; border-radius: 18px; overflow: hidden; background: #0e1a12; aspect-ratio: 16/9; cursor: pointer; border: 1px solid var(--line); text-align: left; width: 100%; color: inherit; padding: 0; }
    .feature-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .9s var(--ease); }
    .feature-card:hover img { transform: scale(1.04); }
    .feature-card .scrim { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,14,11,.94) 0%, rgba(10,14,11,.45) 45%, rgba(10,14,11,0) 75%); }
    .play-ring { display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 50%; background: var(--cream); color: #0f1a12; box-shadow: 0 12px 32px rgba(0,0,0,.45); transition: transform 200ms var(--ease), background 200ms var(--ease); }
    .feature-card:hover .play-ring, .reel-card:hover .play-ring { transform: scale(1.08); background: var(--lime); }

    .reel-row { display: flex; gap: 14px; overflow-x: auto; scroll-snap-type: x mandatory; padding: 4px 4px 18px; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
    .reel-row::-webkit-scrollbar { display: none; }
    .reel-card { position: relative; flex: 0 0 auto; width: clamp(190px, 22vw, 250px); aspect-ratio: 9/16; border-radius: 16px; overflow: hidden; background: #0e1a12; scroll-snap-align: start; cursor: pointer; border: 1px solid var(--line); padding: 0; text-align: left; color: inherit; }
    .reel-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .8s var(--ease); }
    .reel-card:hover img { transform: scale(1.05); }
    .reel-card .scrim { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,14,11,.92) 0%, rgba(10,14,11,.2) 50%, rgba(10,14,11,.15) 100%); }
    .reel-card .play-ring { width: 44px; height: 44px; }

    .prog-row { display: grid; grid-template-columns: 120px 1fr auto; gap: 18px; align-items: center; padding: 18px 16px; border-top: 1px solid var(--line); border-radius: 0; transition: background 160ms var(--ease); }
    .prog-row:last-child { border-bottom: 1px solid var(--line); }
    .prog-row.active { background: linear-gradient(90deg, rgba(82,184,112,.16), rgba(82,184,112,.02)); border-radius: 12px; border-color: transparent; }
    @media (max-width: 560px) { .prog-row { grid-template-columns: 1fr; gap: 6px; } }

    .soc-card { display: flex; flex-direction: column; gap: 14px; padding: 26px; border-radius: 18px; background: var(--ink-3); border: 1px solid var(--line); transition: transform 200ms var(--ease), border-color 200ms var(--ease); }
    .soc-card:hover { transform: translateY(-4px); border-color: var(--line-strong); }

    .region-card { position: relative; display: block; border-radius: 16px; overflow: hidden; min-height: 320px; cursor: pointer; border: 1px solid var(--line); padding: 0; text-align: left; color: inherit; width: 100%; background: #0e1a12; }
    .region-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .9s var(--ease), filter .5s var(--ease); }
    .region-card:hover img { transform: scale(1.05); filter: brightness(1.08); }

    .footer-link { color: var(--cream-70); text-decoration: none; display: inline-flex; align-items: center; min-height: 36px; transition: color 150ms var(--ease); }
    .footer-link:hover { color: var(--green); }

    .wa-panel { animation: waPop .22s cubic-bezier(.34,1.56,.64,1) forwards; }
    @keyframes waPop { from { opacity: 0; transform: scale(.9) translateY(12px); } to { opacity: 1; transform: none; } }
    .wa-opt { transition: background 150ms var(--ease), transform 120ms var(--ease); cursor: pointer; }
    .wa-opt:hover { background: #f0fdf4 !important; transform: translateX(3px); }
    .wa-fab { transition: transform 180ms var(--ease), box-shadow 180ms var(--ease); }
    .wa-fab:hover { transform: scale(1.06); }

    ::-webkit-scrollbar { height: 6px; width: 10px; }
    ::-webkit-scrollbar-track { background: var(--ink); }
    ::-webkit-scrollbar-thumb { background: var(--green-deep); border-radius: 4px; }
    ::selection { background: var(--lime); color: #111; }
  `}</style>
);

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const K = (style) => ({ fontFamily: "var(--font)", ...style });

const Waveform = ({ color = "#52B870", height = 24 }) => (
  <div aria-hidden="true" style={{ display: "flex", alignItems: "flex-end", gap: 3, height }}>
    {[0, 0.1, 0.2, 0.3, 0.4].map((d, i) => (
      <div key={i} className="wave-bar" style={{ width: 4, height, background: color, borderRadius: 2, animationDelay: `${d}s` }} />
    ))}
  </div>
);

// Mosaico verde: la misma textura pixelada de los thumbnails de Araucana
// Digital, generada como SVG determinista (misma semilla → mismo dibujo).
function mosaicDataUri(seed = 7, cols = 26, rows = 14, cell = 48) {
  let s = seed >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const palette = ["#0b2416", "#123320", "#1a4a2a", "#23683a", "#2f8a45", "#4aab55", "#7ccb68", "#a8de5e"];
  const weights = [0.30, 0.22, 0.17, 0.12, 0.09, 0.05, 0.03, 0.02];
  let rects = "";
  const pickColor = () => { const r = rnd(); let acc = 0; for (let i = 0; i < weights.length; i++) { acc += weights[i]; if (r <= acc) return palette[i]; } return palette[0]; };
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    rects += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${pickColor()}"/>`;
  }
  // Bloques grandes (2×2) para romper la regularidad, como en las miniaturas.
  for (let i = 0; i < Math.floor(cols * rows * 0.05); i++) {
    const x = Math.floor(rnd() * (cols - 1)), y = Math.floor(rnd() * (rows - 1));
    rects += `<rect x="${x * cell}" y="${y * cell}" width="${cell * 2}" height="${cell * 2}" fill="${pickColor()}"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cell}" height="${rows * cell}" shape-rendering="crispEdges">${rects}</svg>`;
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
}

function Mosaic({ seed = 7, opacity = 0.35, style, drift = true, mask = "linear-gradient(to bottom, rgba(0,0,0,.9), rgba(0,0,0,.35) 60%, transparent)" }) {
  const uri = useMemo(() => mosaicDataUri(seed), [seed]);
  return (
    <div aria-hidden="true" className={drift ? "mosaic-drift" : undefined} style={{
      position: "absolute", inset: 0, pointerEvents: "none", opacity,
      backgroundImage: uri, backgroundSize: "1248px 672px", backgroundRepeat: "repeat",
      WebkitMaskImage: mask, maskImage: mask,
      ...style,
    }} />
  );
}

const fmtViews = (n) => {
  if (!n) return "";
  const v = new Intl.NumberFormat("es-CL", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  return `${v} vistas`;
};
const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const days = Math.round((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "hoy";
  if (days < 7) return new Intl.RelativeTimeFormat("es-CL", { numeric: "auto" }).format(-days, "day");
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", year: days > 300 ? "numeric" : undefined }).format(d);
};
const cleanTitle = (t = "") => t.replace(/#shorts?/gi, "").replace(/\|\s*Araucana Digital\s*$/i, "").replace(/\s{2,}/g, " ").trim();

// Extract YouTube videoId from common URL formats
function getYouTubeId(url) {
  if (!url || typeof url !== "string") return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? m[1] : null;
}

// Contador que avanza cada minuto: sirve para recalcular el programa al aire
// sin llamar setState dentro del cuerpo del efecto.
function useMinuteTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  return tick;
}

// Reveal on scroll (una coreografía por sección; visible de inmediato con
// prefers-reduced-motion porque el CSS anula la transición).
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { el?.classList.add("in"); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ─── YouTube data (podcast + shorts) ─────────────────────────────────────── */
// Orden manual definido en /admin (settings.youtubeOrder):
//   { episodes: [{ id, title, published }], shorts: [...], hidden: [id] }
// Los videos que aún no están en la lista guardada (publicados después de
// ordenar) van primero, por fecha; después va el orden guardado. Un video
// guardado que ya salió del feed (más antiguo que los últimos 15) se sigue
// mostrando con los datos guardados. Los ocultos no aparecen.
// La misma lógica vive en public/admin.html (applyOrder): mantenerlas iguales.
function applyYouTubeOrder(items, saved = [], hidden = [], vertical = false) {
  if (!Array.isArray(saved) || saved.length === 0) {
    return hidden.length ? items.filter((v) => !hidden.includes(v.id)) : items;
  }
  const byId = new Map(items.map((v) => [v.id, v]));
  const savedIds = new Set(saved.map((s) => s.id));
  const fresh = items.filter((v) => !savedIds.has(v.id));
  const ordered = saved.map((s) => byId.get(s.id) || (s.id && {
    id: s.id,
    title: s.title || "",
    published: s.published || "",
    views: 0,
    url: vertical ? `https://www.youtube.com/shorts/${s.id}` : `https://www.youtube.com/watch?v=${s.id}`,
    // En un short, hqdefault es la miniatura diseñada que se subió a YouTube;
    // oar2 es un cuadro del video, igual que en los reels que vienen del feed.
    thumb: vertical ? `https://i.ytimg.com/vi/${s.id}/oar2.jpg` : `https://i.ytimg.com/vi/${s.id}/hqdefault.jpg`,
    thumbHd: vertical ? `https://i.ytimg.com/vi/${s.id}/oar2.jpg` : `https://i.ytimg.com/vi/${s.id}/maxresdefault.jpg`,
    thumbFallback: `https://i.ytimg.com/vi/${s.id}/hqdefault.jpg`,
  })).filter(Boolean);
  return [...fresh, ...ordered].filter((v) => !hidden.includes(v.id));
}

function useYouTube() {
  const { videos, settings } = useSiteContent();
  const videosRef = useRef(videos);
  useEffect(() => { videosRef.current = videos; }, [videos]);
  const [raw, setState] = useState({ loading: true, episodes: [], shorts: [], fromFallback: false });
  const order = settings?.youtubeOrder;

  // Una sola consulta por visita: el fallback lee los videos del admin desde
  // el ref para no relanzar el fetch cuando /api/content actualiza el contexto.
  useEffect(() => {
    let alive = true;
    const fallback = () => {
      const eps = (videosRef.current || []).map((v) => {
        const id = getYouTubeId(v.youtube);
        return id ? { id, title: v.title, url: v.youtube, thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, thumbHd: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, published: "", views: 0 } : null;
      }).filter(Boolean);
      if (alive) setState({ loading: false, episodes: eps, shorts: [], fromFallback: true });
    };
    fetch("/api/youtube")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive) return;
        if (data && Array.isArray(data.episodes) && (data.episodes.length || data.shorts?.length)) {
          setState({ loading: false, episodes: data.episodes, shorts: data.shorts || [], fromFallback: false });
        } else fallback();
      })
      .catch(fallback);
    return () => { alive = false; };
  }, []);

  return useMemo(() => {
    if (raw.loading || raw.fromFallback || !order) return raw;
    const hidden = Array.isArray(order.hidden) ? order.hidden : [];
    return {
      ...raw,
      episodes: applyYouTubeOrder(raw.episodes, order.episodes, hidden, false),
      shorts: applyYouTubeOrder(raw.shorts, order.shorts, hidden, true),
    };
  }, [raw, order]);
}

/* ─── Video modal (reproductor embebido) ──────────────────────────────────── */
function VideoModal({ video, vertical = false, onClose, playlist = [], onNavigate }) {
  const closeRef = useRef(null);
  const boxRef = useRef(null);
  const idx = playlist.findIndex((v) => v.id === video.id);
  const prev = idx > 0 ? playlist[idx - 1] : null;          // más reciente
  const next = idx >= 0 && idx < playlist.length - 1 ? playlist[idx + 1] : null; // anterior en el tiempo
  // Las flechas leen prev/next desde un ref para que el efecto de foco y
  // teclado se monte una sola vez y no vuelva a enfocar "Cerrar" al navegar.
  const navRef = useRef({ prev: null, next: null, onNavigate: null });
  useEffect(() => { navRef.current = { prev, next, onNavigate }; }, [prev, next, onNavigate]);

  useEffect(() => {
    const prevFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      const nav = navRef.current;
      if (e.key === "ArrowLeft" && nav.prev && nav.onNavigate) { nav.onNavigate(nav.prev); return; }
      if (e.key === "ArrowRight" && nav.next && nav.onNavigate) { nav.onNavigate(nav.next); return; }
      if (e.key !== "Tab" || !boxRef.current) return;
      const f = boxRef.current.querySelectorAll('button, a[href], iframe, [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); prevFocus?.focus?.(); };
  }, [onClose]);

  const title = cleanTitle(video.title);
  const label = vertical ? "reel" : "capítulo";
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(8,10,9,.88)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px" }}>
      <div ref={boxRef} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: vertical ? 420 : 1040, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <p style={K({ fontWeight: 700, fontSize: 15, color: "var(--cream)", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" })}>{title}</p>
          <button ref={closeRef} onClick={onClose} className="icon-btn" aria-label="Cerrar video" style={{ flexShrink: 0, background: "rgba(246,243,238,.08)" }}><X size={20} /></button>
        </div>
        <div style={{ position: "relative", width: "100%", aspectRatio: vertical ? "9/16" : "16/9", maxHeight: "78vh", borderRadius: 16, overflow: "hidden", background: "#000", border: "1px solid var(--line-strong)", boxShadow: "0 40px 90px rgba(0,0,0,.6)" }}>
          <iframe
            title={title}
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {playlist.length > 1 && onNavigate && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => prev && onNavigate(prev)} disabled={!prev} aria-label={prev ? `${vertical ? "Reel" : "Capítulo"} más reciente: ${cleanTitle(prev.title)}` : `No hay ${label} más reciente`} style={{ opacity: prev ? 1 : .4, maxWidth: "48%" }}>
              <ChevronLeft size={16} aria-hidden="true" /> <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>Más reciente</span>
            </button>
            <span className="meta" style={{ whiteSpace: "nowrap" }}>{idx + 1} / {playlist.length}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => next && onNavigate(next)} disabled={!next} aria-label={next ? `${vertical ? "Reel" : "Capítulo"} anterior: ${cleanTitle(next.title)}` : `No hay ${label} anterior`} style={{ opacity: next ? 1 : .4, maxWidth: "48%" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{vertical ? "Siguiente reel" : "Capítulo anterior"}</span> <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <a href={video.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><SvgYoutube size={16} /> Ver en YouTube <ArrowUpRight size={14} /></a>
          <a href={`${YT_CHANNEL}?sub_confirmation=1`} target="_blank" rel="noreferrer" className="btn btn-red btn-sm">Suscribirse al canal</a>
        </div>
      </div>
    </div>
  );
}

/* ─── Live player (hero) ──────────────────────────────────────────────────── */
// Videos de fondo cuando no hay transmisión: se elige uno al azar por visita
// para que el header no muestre siempre el mismo loop.
const BG_VIDEOS = ["/bg-placeholder.mp4", "/bg-estudio.mp4", "/bg-araucania.mp4"];
const BG_VIDEO = BG_VIDEOS[Math.floor(Math.random() * BG_VIDEOS.length)];

// El video es decorativo (va bajo un overlay oscuro): en pantallas chicas,
// con prefers-reduced-motion o con ahorro de datos activo no se descarga.
const useBgVideoEnabled = () => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 768px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(!mobile.matches && !reduced.matches && navigator.connection?.saveData !== true);
    update();
    mobile.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => { mobile.removeEventListener("change", update); reduced.removeEventListener("change", update); };
  }, []);
  return enabled;
};

// Extrae el src de un <iframe> pegado en el admin. Renderizamos un <iframe>
// controlado en vez de inyectar HTML crudo (evita XSS y respeta el CSP).
function extractIframeSrc(code) {
  if (!code || typeof code !== "string") return null;
  const m = code.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

// Reproductor HLS (.m3u8) para la señal en vivo de XtreamCast.
// Safari/iOS reproducen HLS de forma nativa; el resto usa hls.js cargado
// bajo demanda (import dinámico) para no inflar el bundle de la portada.
function HlsPlayer({ src }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    let hls;
    let cancelled = false;
    let netRetries = 0;
    const onNativeErr = () => setError(true);
    import("hls.js")
      .then(({ default: Hls }) => {
        if (cancelled) return;
        if (Hls.isSupported()) {
          hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.ERROR, (_evt, data) => {
            if (!data.fatal) return;
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR && netRetries < 2) { netRetries += 1; hls.startLoad(); }
            else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) { hls.recoverMediaError(); }
            else { setError(true); hls.destroy(); }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src;
          video.addEventListener("error", onNativeErr);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
    return () => { cancelled = true; video.removeEventListener("error", onNativeErr); if (hls) hls.destroy(); };
  }, [src]);

  if (error) return <LiveOffline message="No se pudo cargar la señal en vivo. Intenta recargar en unos minutos." />;
  return (
    <video ref={videoRef} aria-label="Transmisión en vivo" controls autoPlay muted playsInline
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", background: "#000", border: 0 }} />
  );
}

function LiveIframe({ code }) {
  const src = extractIframeSrc(code);
  if (!src) return <LiveOffline />;
  return (
    <iframe title="Transmisión en vivo" src={src}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
  );
}

// Estado "sin transmisión": placeholder con video de fondo, el logo, la
// frecuencia y un enlace al podcast.
function LiveOffline({ message = "Sin transmisión de video en este momento" }) {
  const showVideo = useBgVideoEnabled();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#0d1a12" }}>
      {showVideo && (
        <video autoPlay loop muted playsInline preload="none" aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}>
          <source src={BG_VIDEO} type="video/mp4" />
        </video>
      )}
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,20,14,0.62)" }} />
      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: "0 16px" }}>
        <div style={{ position: "relative", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {[0, 0.5, 1.0].map((delay, i) => (
            <div key={i} aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(82,184,112,0.6)", animation: `signalRing 2.4s ease-out ${delay}s infinite` }} />
          ))}
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(41,98,58,0.85)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backdropFilter: "blur(4px)" }}>
            <Play size={20} color="#fff" fill="#fff" aria-hidden="true" />
          </div>
        </div>
        <LogoSVG height={38} color="#ffffff" />
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={K({ fontWeight: 700, fontSize: 18, color: "var(--green)", letterSpacing: "0.1em" })}>95.9 FM</p>
          <p style={K({ fontWeight: 400, fontSize: 13, color: "rgba(255,255,255,0.78)" })}>{message}</p>
          <a href="#podcast" style={K({ fontWeight: 700, fontSize: 13, color: "var(--lime)", marginTop: 4, textDecoration: "none", display: "inline-flex", minHeight: 44, alignItems: "center", justifyContent: "center" })}>Ver el podcast ↓</a>
        </div>
      </div>
    </div>
  );
}

const LivePlaceholder = () => {
  const { settings } = useSiteContent();
  const lv = settings.liveVideo || {};
  if (lv.enabled) {
    if (lv.type === "iframe" && lv.iframeCode) return <LiveIframe code={lv.iframeCode} />;
    if ((lv.type === "hls" || !lv.type) && lv.hlsUrl) return <HlsPlayer key={lv.hlsUrl} src={lv.hlsUrl} />;
  }
  if (!lv.enabled) {
    const ytId = getYouTubeId(settings.offlineVideo) || getYouTubeId(settings.liveStreamUrl);
    if (ytId) {
      return (
        <iframe title="Video destacado" src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      );
    }
  }
  return <LiveOffline />;
};

function liveState(settings) {
  const live = Boolean(settings.liveVideo?.enabled);
  const hasVideo = !live && Boolean(getYouTubeId(settings.offlineVideo) || getYouTubeId(settings.liveStreamUrl));
  return { live, hasVideo, label: live ? "En vivo ahora" : hasVideo ? "Video destacado" : "Señal 95.9 FM" };
}

/* ─── Header ──────────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "En vivo",       href: "#inicio" },
  { label: "Podcast",       href: "#podcast" },
  { label: "Reels",         href: "#reels" },
  { label: "Programación",  href: "#programacion" },
  { label: "Noticias",      href: "#noticias" },
  { label: "Contacto",      href: "/contacto" },
  { label: "La Frontera",   href: "/frontera" },
];

function Header({ playing, toggle }) {
  const [open, setOpen] = useState(false);
  const { settings, news } = useSiteContent();
  const showNews = newsVisible(settings, news);
  const links = NAV_LINKS.filter((l) => l.href !== "#noticias" || showNews);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="site-header">
      <div className="container" style={{ height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <a href="#inicio" aria-label="Radio Araucana 95.9 FM, ir al inicio" style={{ display: "inline-flex", alignItems: "center", minHeight: 44 }}>
          <LogoSVG height={40} color="#F6F3EE" />
        </a>

        <nav aria-label="Secciones" className="hidden lg:flex" style={{ gap: 2, alignItems: "center" }}>
          {links.map((l) => (
            <a key={l.label} href={l.href} className="nav-link">{l.label}</a>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a href={`${YT_CHANNEL}?sub_confirmation=1`} target="_blank" rel="noreferrer" className="icon-btn hidden sm:inline-flex" aria-label="Suscribirse al canal de YouTube de Radio Araucana"><SvgYoutube size={18} /></a>
          <button className="live-pill" onClick={toggle} aria-pressed={playing} aria-label={playing ? "Pausar Radio Araucana 95.9 FM" : "Escuchar Radio Araucana 95.9 FM en vivo"}>
            <span className="live-dot" aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
            {playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} fill="#fff" aria-hidden="true" />}
            <span>{playing ? "Al aire" : "En vivo"}</span>
          </button>
          <button onClick={() => setOpen(!open)} className="icon-btn lg:hidden" aria-label={open ? "Cerrar menú" : "Abrir menú"} aria-expanded={open} aria-controls="menu-movil">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="menu-movil" aria-label="Secciones" className="mobile-menu lg:hidden container" style={{ paddingTop: 6, paddingBottom: 18, borderTop: "1px solid var(--line)", background: "rgba(25,25,25,.96)" }}>
          {links.map((l) => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)}>{l.label} <ChevronRight size={18} aria-hidden="true" style={{ color: "var(--cream-55)" }} /></a>
          ))}
          <div style={{ display: "flex", gap: 10, paddingTop: 16 }}>
            {SOC_LINKS.map(({ key, label, href, Icon }) => (
              <a key={key} href={href} target="_blank" rel="noreferrer" className="icon-btn" aria-label={`Radio Araucana en ${label}`}><Icon /></a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

/* ─── Hero ────────────────────────────────────────────────────────────────── */
function Hero({ playing, toggle, latest }) {
  const { programs: PROGRAMS, settings } = useSiteContent();
  useMinuteTick(); // re-render cada minuto para actualizar el programa al aire
  const progIdx = getCurrentProgram(PROGRAMS);
  const currentProg = progIdx >= 0 ? PROGRAMS[progIdx] : null;
  const ls = liveState(settings);

  return (
    <section id="inicio" aria-labelledby="hero-title" style={{ position: "relative", overflow: "hidden", background: "var(--ink)", padding: "clamp(44px, 7vw, 96px) 0 clamp(40px, 6vw, 72px)" }}>
      <Mosaic seed={11} opacity={0.34} mask="linear-gradient(115deg, rgba(0,0,0,.05) 0%, rgba(0,0,0,.55) 45%, rgba(0,0,0,.95) 100%)" />
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 70% at 15% 30%, rgba(25,25,25,.96) 0%, rgba(25,25,25,.7) 45%, rgba(25,25,25,0) 100%)", pointerEvents: "none" }} />
      <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 160, background: "linear-gradient(to bottom, rgba(25,25,25,0), var(--ink))", pointerEvents: "none" }} />

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">

          <div className="lg:col-span-6" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div className="fiu-0" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(215,38,30,.14)", border: "1px solid rgba(215,38,30,.4)", borderRadius: 999, padding: "6px 12px 6px 10px" }}>
                <span className="live-dot" aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5a52" }} />
                <span style={K({ fontWeight: 800, fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: "#fff" })}>En vivo · 95.9 FM</span>
              </span>
              <span className="meta" style={{ color: "var(--cream-70)" }}>Temuco · La Araucanía · desde 1960</span>
            </div>

            <h1 id="hero-title" className="fiu-1" style={K({ fontWeight: 800, fontSize: "clamp(40px, 6.2vw, 84px)", lineHeight: 0.98, letterSpacing: "-0.035em", color: "var(--cream)" })}>
              La radio de Temuco,<br />
              <span style={{ color: "var(--green)" }}>en vivo</span> y <span style={{ color: "var(--lime)" }}>en video.</span>
            </h1>

            <p className="fiu-1 lede">
              Radio Araucana 95.9 FM es la radio en Temuco que informa a La Araucanía desde 1960. Hoy también hace podcast, entrevistas y reels: escúchanos en el dial o síguenos en YouTube, Instagram y Facebook.
            </p>

            <div className="fiu-3" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <button className="btn btn-red" onClick={toggle} aria-pressed={playing} style={{ minHeight: 54, paddingLeft: 24, paddingRight: 26, fontSize: 15 }}>
                {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} fill="#fff" aria-hidden="true" />}
                {playing ? "Al aire · pausar" : "Escuchar en vivo"}
              </button>
              <a href={latest ? "#podcast" : YT_CHANNEL} className="btn btn-ghost" style={{ minHeight: 54 }}>
                <SvgYoutube size={18} /> {latest ? "Ver el último capítulo" : "Ver el canal"}
              </a>
            </div>

            {currentProg && (
              <div className="fiu-3" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 14, background: "rgba(246,243,238,.05)", border: "1px solid var(--line)", maxWidth: 520 }}>
                <Waveform />
                <div style={{ minWidth: 0 }}>
                  <p className="meta" style={{ color: "var(--green)", marginBottom: 2 }}>Ahora al aire</p>
                  <p style={K({ fontWeight: 700, fontSize: 16, color: "var(--cream)", lineHeight: 1.25 })}>{currentProg.name}</p>
                  <p style={K({ fontWeight: 400, fontSize: 13, color: "var(--cream-70)", marginTop: 2, fontVariantNumeric: "tabular-nums" })}>{currentProg.host} · {currentProg.start} – {currentProg.end}</p>
                </div>
              </div>
            )}

            <ul className="fiu-3" aria-label="Redes sociales de Radio Araucana" style={{ listStyle: "none", display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SOC_LINKS.map(({ key, label, handle, href, Icon }) => (
                <li key={key}>
                  <a href={href} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" aria-label={`${label}: ${handle}`} style={{ background: "transparent" }}>
                    <Icon size={16} /> <span>{handle}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-6 fiu-4" style={{ position: "relative", display: "flex", flexDirection: "column", gap: 12 }}>
            <span aria-hidden="true" style={K({ position: "absolute", top: "-0.55em", right: -6, fontWeight: 800, fontSize: "clamp(56px, 7vw, 104px)", lineHeight: 1, letterSpacing: "-0.04em", color: "transparent", WebkitTextStroke: "1.5px rgba(180,227,86,0.35)", pointerEvents: "none", userSelect: "none", zIndex: 0 })}>95.9</span>
            <div style={{ position: "relative", zIndex: 1, aspectRatio: "16/9", borderRadius: 18, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(246,243,238,.1)", background: "#0d1a12" }}>
              <LivePlaceholder />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: ls.live ? "#ff5a52" : "var(--green)" }} />
                <span className="meta" style={{ color: "var(--cream-70)", textTransform: "none", letterSpacing: 0, fontSize: 13, fontWeight: 600 }}>{ls.label}</span>
              </div>
              <span className="meta">Radio Araucana · Temuco</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ─── Weather Ticker ──────────────────────────────────────────────────────── */
const WEATHER_CITIES = [
  { name: "Temuco",     lat: -38.7396, lon: -72.5984 },
  { name: "Pucón",      lat: -39.2727, lon: -71.9587 },
  { name: "Villarrica", lat: -39.2827, lon: -72.2293 },
  { name: "Angol",      lat: -37.7983, lon: -72.7136 },
  { name: "Victoria",   lat: -38.2326, lon: -72.3312 },
  { name: "Lautaro",    lat: -38.5271, lon: -72.4382 },
];
const WMO = {
  0: "Despejado", 1: "Mayormente despejado", 2: "Parcialmente nublado", 3: "Nublado", 45: "Neblina", 48: "Neblina",
  51: "Llovizna", 53: "Llovizna", 55: "Llovizna", 61: "Lluvia leve", 63: "Lluvia", 65: "Lluvia intensa",
  71: "Nieve", 73: "Nieve", 75: "Nieve intensa", 80: "Chubascos", 81: "Chubascos", 82: "Chubascos fuertes", 95: "Tormenta",
};

function WeatherTicker() {
  const [weather, setWeather] = useState(null);
  useEffect(() => {
    Promise.all(WEATHER_CITIES.map((c) =>
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,weathercode&timezone=America/Santiago`)
        .then((r) => r.json())
        .then((d) => ({ name: c.name, temp: Math.round(d.current.temperature_2m), label: WMO[d.current.weathercode] ?? "Variable" }))
        .catch(() => null)
    )).then((results) => setWeather(results.filter(Boolean)));
  }, []);

  const items = weather === null
    ? ["Cargando el tiempo en La Araucanía"]
    : weather.length > 0
      ? weather.map((c) => `${c.name} ${c.temp}°C · ${c.label}`)
      : WEATHER_CITIES.map((c) => c.name);
  const text = items.join("      ·      ") + "      ·      ";

  return (
    <div className="marquee" style={{ background: "var(--green-deep)", borderTop: "1px solid rgba(246,243,238,.08)", borderBottom: "1px solid rgba(246,243,238,.08)", display: "flex", alignItems: "stretch", overflow: "hidden" }}>
      <div className="hidden sm:flex" style={{ background: "#1e4b2c", padding: "11px 18px", alignItems: "center", gap: 8, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.15)" }}>
        <span style={K({ fontWeight: 800, fontSize: 11, color: "#fff", textTransform: "uppercase", letterSpacing: "0.16em", whiteSpace: "nowrap" })}>El tiempo</span>
      </div>
      <div style={{ overflow: "hidden", flex: 1, padding: "11px 0" }} aria-live="off">
        <div className="marquee-track">
          <span style={K({ fontWeight: 600, fontSize: 13, color: "#fff", letterSpacing: "0.03em", fontVariantNumeric: "tabular-nums" })}>
            {text}<span aria-hidden="true">{text}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Podcast (Araucana Digital) ──────────────────────────────────────────── */
function SectionHead({ id, kicker, title, lede, aside }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, flexWrap: "wrap", marginBottom: "clamp(28px, 4vw, 44px)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 720 }}>
        {kicker && <span className="kicker">{kicker}</span>}
        <h2 id={id} className="h2">{title}</h2>
        {lede && <p className="lede">{lede}</p>}
      </div>
      {aside && <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{aside}</div>}
    </div>
  );
}

function PodcastSection({ data, onPlay }) {
  const ref = useReveal();
  const { loading, episodes } = data;
  const [expanded, setExpanded] = useState(false);
  const [featured, ...rest] = episodes;
  const PREVIEW = 5;
  const list = expanded ? rest : rest.slice(0, PREVIEW);
  const hidden = rest.length - list.length;
  // Con orden manual el primero puede no ser el más nuevo: la etiqueta lo dice.
  const featuredIsLatest = Boolean(featured) && episodes.every((e) => !e.published || e.published <= (featured.published || ""));

  return (
    <section id="podcast" aria-labelledby="podcast-title" style={{ position: "relative", overflow: "hidden", background: "var(--ink-2)", padding: "clamp(64px, 9vw, 120px) 0" }}>
      <Mosaic seed={23} opacity={0.16} drift={false} mask="radial-gradient(70% 60% at 85% 20%, rgba(0,0,0,.9), transparent 70%)" />
      <div className="container reveal" ref={ref} style={{ position: "relative", zIndex: 1 }}>
        <SectionHead
          id="podcast-title"
          kicker="Araucana Digital · Podcast"
          title="Las conversaciones de La Araucanía, en video."
          lede="Entrevistas completas con las personas que mueven la región: deporte, cultura, negocios y política. Un capítulo nuevo cada semana en YouTube."
          aside={<>
            <a href={YT_CHANNEL} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Ver todos los capítulos <ArrowUpRight size={15} aria-hidden="true" /></a>
            <a href={`${YT_CHANNEL}?sub_confirmation=1`} target="_blank" rel="noreferrer" className="btn btn-red btn-sm"><SvgYoutube size={16} /> Suscribirse</a>
          </>}
        />

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 skeleton" style={{ aspectRatio: "16/9", borderRadius: 18 }} />
            <div className="lg:col-span-5" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 96 }} />)}
            </div>
          </div>
        ) : !featured ? (
          <p className="lede">Muy pronto: los capítulos se publican en <a href={YT_CHANNEL} style={{ color: "var(--green)" }}>nuestro canal de YouTube</a>.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            <div className="lg:col-span-7">
              <button className="feature-card" onClick={() => onPlay(featured, false)} aria-label={`Reproducir: ${cleanTitle(featured.title)}`}>
                <img src={featured.thumbHd || featured.thumb} alt="" width="1280" height="720" loading="eager" decoding="async"
                  onError={(e) => { if (featured.thumb && e.currentTarget.src !== featured.thumb) e.currentTarget.src = featured.thumb; }} />
                <div className="scrim" aria-hidden="true" style={{ background: "linear-gradient(to top, rgba(10,14,11,.55) 0%, rgba(10,14,11,0) 40%)" }} />
                <div style={{ position: "absolute", top: 18, left: 18 }}>
                  <span style={K({ background: "var(--lime)", color: "#111", fontWeight: 800, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", padding: "6px 10px", borderRadius: 6 })}>{featuredIsLatest ? "Último capítulo" : "Capítulo destacado"}</span>
                </div>
                <div style={{ position: "absolute", right: 20, bottom: 20 }}>
                  <span className="play-ring" aria-hidden="true"><Play size={26} fill="currentColor" style={{ marginLeft: 3 }} /></span>
                </div>
              </button>
              <div style={{ padding: "18px 6px 0", display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={K({ fontWeight: 800, fontSize: "clamp(20px, 2.2vw, 28px)", lineHeight: 1.12, letterSpacing: "-0.02em", color: "var(--cream)" })}>{cleanTitle(featured.title)}</p>
                <p className="meta">{[fmtDate(featured.published), fmtViews(featured.views), "Araucana Digital"].filter(Boolean).join(" · ")}</p>
              </div>
            </div>

            <div className="lg:col-span-5" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <p className="meta" style={{ padding: "0 14px 10px", color: "var(--cream-55)" }}>Capítulos anteriores</p>
              {list.map((ep) => (
                <button key={ep.id} className="ep-card" onClick={() => onPlay(ep, false)} aria-label={`Reproducir: ${cleanTitle(ep.title)}`}>
                  <div className="thumb">
                    <img src={ep.thumb} alt="" width="480" height="270" loading="lazy" decoding="async" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={K({ fontWeight: 700, fontSize: 15, lineHeight: 1.3, color: "var(--cream)", marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" })}>{cleanTitle(ep.title)}</p>
                    <p className="meta">{[fmtDate(ep.published), fmtViews(ep.views)].filter(Boolean).join(" · ")}</p>
                  </div>
                </button>
              ))}
              {hidden > 0 && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setExpanded(true)} aria-expanded={false} style={{ alignSelf: "flex-start", margin: "12px 14px 0" }}>
                  Ver {hidden} {hidden === 1 ? "capítulo más" : "capítulos más"} <ChevronDown size={16} aria-hidden="true" />
                </button>
              )}
              <a href={YT_CHANNEL} target="_blank" rel="noreferrer" className="footer-link" style={{ padding: "14px 14px 0", fontWeight: 700, fontSize: 14, color: "var(--green)" }}>Archivo completo en YouTube <ArrowUpRight size={15} aria-hidden="true" style={{ marginLeft: 6 }} /></a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Reels / Shorts ──────────────────────────────────────────────────────── */
function ReelsSection({ data, onPlay }) {
  const ref = useReveal();
  const rowRef = useRef(null);
  const { loading, shorts } = data;
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const update = useCallback(() => {
    const el = rowRef.current; if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);
  useEffect(() => {
    const el = rowRef.current; if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { el.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [update, shorts.length]);
  const scrollBy = (dir) => { const el = rowRef.current; if (el) el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" }); };

  if (!loading && shorts.length === 0) return null;

  return (
    <section id="reels" aria-labelledby="reels-title" style={{ background: "var(--ink)", padding: "clamp(64px, 9vw, 120px) 0", overflow: "hidden" }}>
      <div className="container reveal" ref={ref}>
        <SectionHead
          id="reels-title"
          kicker="Reels y Shorts"
          title="Un minuto de La Araucanía."
          lede="Los momentos que quedan: frases, ideas y datos de cada entrevista, en vertical para ver desde el teléfono."
          aside={<>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="icon-btn" onClick={() => scrollBy(-1)} disabled={!canPrev} aria-label="Reels anteriores"><ChevronLeft size={20} /></button>
              <button className="icon-btn" onClick={() => scrollBy(1)} disabled={!canNext} aria-label="Más reels"><ChevronRight size={20} /></button>
            </div>
          </>}
        />
      </div>

      <div className="container">
        <div ref={rowRef} className="reel-row" role="list" aria-label="Reels recientes">
          {loading
            ? [0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ flex: "0 0 auto", width: "clamp(190px, 22vw, 250px)", aspectRatio: "9/16", borderRadius: 16 }} />)
            : shorts.map((s) => (
              <div key={s.id} role="listitem" style={{ display: "contents" }}>
                <button className="reel-card" onClick={() => onPlay(s, true)} aria-label={`Reproducir reel: ${cleanTitle(s.title)}`}>
                  <img src={s.thumb} alt="" width="405" height="720" loading="lazy" decoding="async"
                    onError={(e) => { if (s.thumbFallback && e.currentTarget.src !== s.thumbFallback) e.currentTarget.src = s.thumbFallback; }} />
                  <div className="scrim" aria-hidden="true" />
                  <div style={{ position: "absolute", top: 14, left: 14 }}><span className="play-ring" aria-hidden="true"><Play size={18} fill="currentColor" /></span></div>
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 16 }}>
                    <p style={K({ fontWeight: 700, fontSize: 14, lineHeight: 1.3, color: "#fff", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 6 })}>{cleanTitle(s.title)}</p>
                    <p className="meta" style={{ color: "rgba(255,255,255,.7)" }}>{fmtViews(s.views) || fmtDate(s.published)}</p>
                  </div>
                </button>
              </div>
            ))}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
          <a href="https://www.instagram.com/araucanaradio" target="_blank" rel="noreferrer" className="btn btn-cream btn-sm"><SvgInstagram size={16} /> Seguir en Instagram</a>
          <a href={`${YT_CHANNEL}/shorts`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><SvgYoutube size={16} /> Todos los shorts</a>
        </div>
      </div>
    </section>
  );
}

/* ─── Program Schedule ────────────────────────────────────────────────────── */
const toMinutes = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

function getCurrentProgram(programs) {
  const parts = new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour").value);
  const m = Number(parts.find((p) => p.type === "minute").value);
  const cur = h * 60 + m;
  const dayMap = { dom: 0, lun: 1, mar: 2, mié: 3, mie: 3, jue: 4, vie: 5, sáb: 6, sab: 6 };
  const wkRaw = (parts.find((p) => p.type === "weekday")?.value || "").toLowerCase().replace(/\.$/, "");
  const today = dayMap[wkRaw] ?? new Date().getDay();
  return (programs || []).findIndex((p) => {
    const days = p.days || [1, 2, 3, 4, 5];
    return days.includes(today) && cur >= toMinutes(p.start) && cur < toMinutes(p.end);
  });
}

function ProgramSchedule({ playing, toggle }) {
  const ref = useReveal();
  const { programs: PROGRAMS } = useSiteContent();
  useMinuteTick(); // re-render cada minuto para actualizar el programa al aire
  const activeIdx = getCurrentProgram(PROGRAMS);

  return (
    <section id="programacion" aria-labelledby="prog-title" style={{ background: "var(--ink-2)", padding: "clamp(64px, 9vw, 120px) 0" }}>
      <div className="container reveal" ref={ref}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4" style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
            <span className="kicker">Programación</span>
            <h2 id="prog-title" className="h2">Lo que suena hoy en el 95.9.</h2>
            <p className="lede">De lunes a viernes, hora de Chile. Sintoniza en Temuco y La Araucanía o escucha en vivo desde cualquier lugar.</p>
            <button className="btn btn-red" onClick={toggle} aria-pressed={playing}>
              {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} fill="#fff" aria-hidden="true" />}
              {playing ? "Al aire · pausar" : "Escuchar en vivo"}
            </button>
          </div>

          <ol className="lg:col-span-8" style={{ listStyle: "none" }} aria-label="Parrilla de hoy">
            {PROGRAMS.map((p, i) => {
              const active = i === activeIdx;
              return (
                <li key={i} className={`prog-row${active ? " active" : ""}`} aria-current={active ? "true" : undefined}>
                  <span style={K({ fontWeight: 700, fontSize: 15, color: active ? "var(--lime)" : "var(--cream-70)", fontVariantNumeric: "tabular-nums", letterSpacing: ".02em" })}>{p.start} – {p.end}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={K({ display: "block", fontWeight: 800, fontSize: "clamp(18px, 2vw, 24px)", letterSpacing: "-0.015em", lineHeight: 1.15, color: "var(--cream)" })}>{p.name}</span>
                    <span style={K({ display: "block", fontWeight: 400, fontSize: 14, color: "var(--cream-70)", marginTop: 3 })}>{p.host}</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 10, justifySelf: "end" }}>
                    {active ? (
                      <>
                        <Waveform height={18} />
                        <span style={K({ fontWeight: 800, fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--lime)" })}>Al aire</span>
                      </>
                    ) : (
                      <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: p.color || "var(--green-deep)" }} />
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
        {activeIdx === -1 && (
          <p style={K({ fontWeight: 400, fontSize: 14, color: "var(--cream-55)", marginTop: 16 })}>Fuera del horario de programas: ahora suena la selección musical de Radio Araucana.</p>
        )}
      </div>
    </section>
  );
}

/* ─── News Grid (se muestra solo con settings.newsEnabled) ────────────────── */
const CAT_COLORS = { REGIÓN: "#29623a", POLÍTICA: "#3a3a3a", CULTURA: "#4a7c59", DEPORTE: "#8B0000", ECONOMÍA: "#1a3a5c", SALUD: "#1a3a5c" };
const CAT_PHOTOS = { DEPORTE: "/news/deporte.jpg", CULTURA: "/news/cultura.jpg", REGIÓN: "/news/region.jpg", POLÍTICA: "/news/politica.jpg", ECONOMÍA: "/news/economia.jpg" };
const CAT_PHOTO_FALLBACK = "/news/region.jpg";

function newsVisible(settings, news) {
  return Boolean(settings?.newsEnabled) && Array.isArray(news) && news.length > 0;
}

function NewsGrid() {
  const ref = useReveal();
  const { news: NEWS, settings } = useSiteContent();
  const [openIdx, setOpenIdx] = useState(null);
  if (!newsVisible(settings, NEWS)) return null;
  return (
    <section id="noticias" aria-labelledby="news-title" style={{ background: "var(--ink)", padding: "clamp(56px, 8vw, 100px) 0" }}>
      <div className="container reveal" ref={ref}>
        <SectionHead id="news-title" kicker="Noticias" title="Lo más reciente." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {NEWS.map((n, i) => {
            const photo = CAT_PHOTOS[n.cat] ?? CAT_PHOTO_FALLBACK;
            const abierta = openIdx === i;
            const tieneBajada = Boolean(n.bajada);
            return (
              <article key={i} style={{ background: "var(--ink-3)", borderRadius: 14, overflow: "hidden", border: "1px solid var(--line)" }}>
                <div style={{ height: 150, position: "relative", overflow: "hidden" }}>
                  <img src={photo} alt="" loading="lazy" decoding="async" width="400" height="150" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <span style={K({ position: "absolute", top: 12, left: 12, background: CAT_COLORS[n.cat] ?? "#29623a", color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 8px", borderRadius: 4 })}>{n.cat}</span>
                </div>
                <div style={{ padding: "14px 16px 16px" }}>
                  <button type="button" onClick={() => setOpenIdx(abierta ? null : i)} aria-expanded={abierta} aria-controls={"noticia-detalle-" + i}
                    style={K({ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, width: "100%", background: "none", border: "none", padding: 0, textAlign: "left", cursor: tieneBajada ? "pointer" : "default", color: "inherit" })}>
                    <h3 style={K({ fontWeight: 700, fontSize: 16, color: "var(--cream)", lineHeight: 1.3 })}>{n.headline}</h3>
                    {tieneBajada && <ChevronDown size={18} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2, transition: "transform 200ms ease", transform: abierta ? "rotate(180deg)" : "none", color: "var(--cream-55)" }} />}
                  </button>
                  {tieneBajada && (
                    <div id={"noticia-detalle-" + i} style={{ display: "grid", gridTemplateRows: abierta ? "1fr" : "0fr", transition: "grid-template-rows 280ms ease" }}>
                      <div style={{ overflow: "hidden", minHeight: 0 }}>
                        <p style={K({ fontWeight: 400, fontSize: 14, color: "var(--cream-70)", lineHeight: 1.55, paddingTop: 8 })}>{n.bajada}</p>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Síguenos ────────────────────────────────────────────────────────────── */
function SocialSection() {
  const ref = useReveal();
  return (
    <section id="siguenos" aria-labelledby="soc-title" style={{ position: "relative", overflow: "hidden", background: "var(--ink)", padding: "clamp(64px, 9vw, 120px) 0" }}>
      <Mosaic seed={41} opacity={0.22} mask="linear-gradient(to top, rgba(0,0,0,.9), rgba(0,0,0,.2) 50%, transparent)" />
      <div className="container reveal" ref={ref} style={{ position: "relative", zIndex: 1 }}>
        <SectionHead id="soc-title" kicker="Síguenos" title="La radio también se ve. Súmate donde estés." lede="Cada capítulo, reel y noticia llega primero a nuestras redes. Elige tu plataforma y no te pierdas nada de lo que pasa en La Araucanía." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SOC_LINKS.map(({ key, label, handle, cta, href, Icon, what }) => (
            <div key={key} className="soc-card">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(246,243,238,.06)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--cream)" }}><Icon size={20} /></span>
                <div>
                  <p style={K({ fontWeight: 800, fontSize: 17, color: "var(--cream)", lineHeight: 1.2 })}>{label}</p>
                  <p className="meta" style={{ textTransform: "none", letterSpacing: 0, fontSize: 13 }}>{handle}</p>
                </div>
              </div>
              <p style={K({ fontWeight: 400, fontSize: 14, color: "var(--cream-70)", lineHeight: 1.5, flex: 1 })}>{what}</p>
              <a href={href} target="_blank" rel="noreferrer" className={`btn btn-sm ${key === "youtube" ? "btn-red" : "btn-cream"}`} aria-label={`${cta} en ${label} (${handle})`} style={{ alignSelf: "flex-start" }}>{cta} <ArrowUpRight size={15} aria-hidden="true" /></a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Regional Stories ────────────────────────────────────────────────────── */
function ArticleModal({ region, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [onClose]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(8,10,9,.86)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div role="dialog" aria-modal="true" aria-labelledby="region-title" onClick={(e) => e.stopPropagation()} style={{ background: "var(--ink-3)", borderRadius: 18, maxWidth: 720, width: "100%", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", border: "1px solid var(--line-strong)" }}>
        <div style={{ position: "relative", height: 280, flexShrink: 0 }}>
          <img src={region.img} alt={region.name} loading="lazy" decoding="async" width="720" height="280" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,14,11,.85) 0%, transparent 60%)" }} />
          <button ref={closeRef} onClick={onClose} className="icon-btn" aria-label="Cerrar artículo" style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,.5)" }}><X size={20} /></button>
          <div style={{ position: "absolute", bottom: 20, left: 24, right: 24 }}>
            <h2 id="region-title" style={K({ fontWeight: 800, fontSize: "clamp(24px, 4vw, 38px)", letterSpacing: "-0.02em", color: "#fff", lineHeight: 1.05 })}>{region.name}</h2>
            <p style={K({ fontWeight: 400, fontSize: 14, color: "rgba(255,255,255,0.85)", margin: "6px 0 0" })}>{region.sub}</p>
          </div>
        </div>
        <div style={{ overflowY: "auto", padding: "28px 28px 32px" }}>
          {region.body.map((p, i) => (
            <p key={i} style={K({ fontWeight: 400, fontSize: 16, color: "var(--cream-70)", lineHeight: 1.75, marginBottom: 18 })}>{p}</p>
          ))}
          <p className="meta" style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>Radio Araucana 95.9 FM · Temuco y La Araucanía</p>
        </div>
      </div>
    </div>
  );
}

function RegionalStories() {
  const ref = useReveal();
  const { regions: REGIONS } = useSiteContent();
  const [active, setActive] = useState(null);
  return (
    <section id="destinos" aria-labelledby="reg-title" style={{ background: "var(--ink-2)", padding: "clamp(64px, 9vw, 120px) 0" }}>
      <div className="container reveal" ref={ref}>
        <SectionHead id="reg-title" kicker="Nuestra región" title="La Araucanía, de la cordillera al mar." lede="Cuatro territorios, una sola casa. Conoce los lugares desde donde contamos la región." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {REGIONS.map((r, i) => (
            <button key={i} className="region-card" onClick={() => setActive(r)} aria-label={`Leer artículo: ${r.name}`}>
              <img src={r.img} alt="" loading="lazy" decoding="async" width="600" height="380" />
              <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,14,11,.94) 0%, rgba(10,14,11,.3) 55%, transparent 100%)" }} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 20 }}>
                <p style={K({ fontWeight: 800, fontSize: "clamp(20px, 2.2vw, 26px)", letterSpacing: "-0.02em", color: "#fff", lineHeight: 1.1, marginBottom: 6 })}>{r.name}</p>
                <p style={K({ fontWeight: 400, fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.4, marginBottom: 10 })}>{r.sub}</p>
                <span style={K({ fontWeight: 700, fontSize: 13, color: "var(--lime)" })}>Leer artículo →</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      {active && <ArticleModal region={active} onClose={() => setActive(null)} />}
    </section>
  );
}

/* ─── Radio La Frontera ───────────────────────────────────────────────────── */
function FronteraSection({ playing, toggle }) {
  const ref = useReveal();
  return (
    <section id="frontera" aria-labelledby="frontera-title" style={{ background: "linear-gradient(160deg, #0d2410 0%, #173a1c 55%, #0a1f0d 100%)", padding: "clamp(64px, 9vw, 110px) 0", position: "relative", overflow: "hidden" }}>
      <Mosaic seed={5} opacity={0.14} drift={false} mask="linear-gradient(to right, transparent, rgba(0,0,0,.8))" />
      <div className="container reveal" ref={ref} style={{ position: "relative", zIndex: 1 }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "flex-start" }}>
            <span className="kicker" style={{ color: "#9BD57A" }}>Emisora hermana · 1110 AM</span>
            <h2 id="frontera-title" className="sr-only">Radio La Frontera 1110 AM</h2>
            <img src="/frontera-logo-white.svg" alt="Radio La Frontera, la primera del sur de Chile" loading="lazy" decoding="async" width="480" height="120" style={{ width: "100%", maxWidth: 440, height: "auto" }} />
            <p className="lede" style={{ color: "rgba(255,255,255,.7)" }}>
              Fundada en octubre de 1939, Radio La Frontera es una de las radios más antiguas del sur de Chile. Folklore, información campesina y la región al día, en el 1110 AM.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn" onClick={toggle} aria-pressed={playing} style={{ background: playing ? "#9BD57A" : "transparent", color: playing ? "#0f1a12" : "#9BD57A", borderColor: "#9BD57A" }}>
                {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} fill="currentColor" aria-hidden="true" />}
                {playing ? "Escuchando La Frontera · pausar" : "Escuchar La Frontera 1110 AM"}
              </button>
              <a href="/frontera" className="btn btn-ghost">Conocer La Frontera <ArrowUpRight size={15} aria-hidden="true" /></a>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 260, height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {[0, 0.6, 1.2].map((delay, i) => (
                <div key={i} aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(155,213,122,0.5)", animation: `signalRing 2.8s ease-out ${delay}s infinite` }} />
              ))}
              <img src="/frontera-listener.jpg" alt="Oyente escuchando Radio La Frontera 1110 AM" width="200" height="200" loading="lazy" decoding="async"
                style={{ width: 200, height: 200, borderRadius: "50%", objectFit: "cover", objectPosition: "center top", border: "2px solid rgba(155,213,122,0.7)", boxShadow: "0 0 50px rgba(155,213,122,0.3)" }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Sobre la radio (SEO: "radio en Temuco") ─────────────────────────────── */
function AboutSection() {
  const ref = useReveal();
  const stats = [
    { n: "1960", l: "Primera radio FM de Chile" },
    { n: "95.9", l: "FM en Temuco y La Araucanía" },
    { n: "65+", l: "Años al aire" },
    { n: "24/7", l: "En vivo por internet" },
  ];
  return (
    <section id="sobre" aria-labelledby="about-title" style={{ background: "var(--ink)", padding: "clamp(64px, 9vw, 120px) 0", borderTop: "1px solid var(--line)" }}>
      <div className="container reveal" ref={ref}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span className="kicker">Radio en Temuco desde 1960</span>
            <h2 id="about-title" className="h2">La primera FM de Chile sigue siendo la voz de La Araucanía.</h2>
            <p className="lede">
              Radio Araucana nació el 1 de enero de 1960 en Temuco como XQD 1, la primera radio de Frecuencia Modulada en Chile y la segunda de Latinoamérica. Desde 1981 transmite desde el Cerro Ñielol y los estudios de audiencia de Ipsos la ubican de forma consistente como la radio en Temuco con mayor sintonía.
            </p>
            <p className="lede">
              Hoy la señal 95.9 FM cubre Temuco, Padre Las Casas y el centro de la región, y el stream en radioaraucana.cl llega a cualquier país. Con Araucana Digital sumamos podcast, entrevistas en video y reels para que la conversación regional también viva en YouTube, Instagram y Facebook.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
              <a href="/sobre-nosotros" className="btn btn-ghost btn-sm">Nuestra historia</a>
              <a href="/faq" className="btn btn-ghost btn-sm">Preguntas frecuentes</a>
              <a href="/cotiza" className="btn btn-green btn-sm">Publicita en la radio</a>
            </div>
          </div>
          <dl className="lg:col-span-5 grid grid-cols-2 gap-3" style={{ alignSelf: "center" }}>
            {stats.map((s) => (
              <div key={s.n} style={{ padding: "22px 20px", borderRadius: 16, background: "var(--ink-3)", border: "1px solid var(--line)" }}>
                <dt className="meta" style={{ marginBottom: 6 }}>{s.l}</dt>
                <dd style={K({ fontWeight: 800, fontSize: "clamp(30px, 3.4vw, 44px)", letterSpacing: "-0.03em", lineHeight: 1, color: "var(--lime)", fontVariantNumeric: "tabular-nums" })}>{s.n}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────────────────────────── */
const FOOTER_LINKS = [
  { title: "Contenido", links: [
    { label: "Señal en vivo",  href: "#inicio" },
    { label: "Podcast",        href: "#podcast" },
    { label: "Reels",          href: "#reels" },
    { label: "Programación",   href: "#programacion" },
    { label: "Nuestra región", href: "#destinos" },
  ]},
  { title: "La radio", links: [
    { label: "Quiénes somos",        href: "/sobre-nosotros" },
    { label: "Preguntas frecuentes", href: "/faq" },
    { label: "Radio La Frontera",    href: "/frontera" },
    { label: "Contacto",             href: "/contacto" },
  ]},
  { title: "Empresas", links: [
    { label: "Cotiza tu publicidad", href: "/cotiza" },
    { label: "Extractos legales",    href: "/frontera/extractos" },
  ]},
];

function Footer() {
  const { settings: SETTINGS } = useSiteContent();
  return (
    <footer id="contacto" style={{ background: "var(--ink-2)", padding: "clamp(48px, 7vw, 80px) 0 0", borderTop: "1px solid var(--line)" }}>
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10" style={{ paddingBottom: 40 }}>
          <div className="lg:col-span-5" style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
            <LogoSVG height={44} color="#F6F3EE" />
            <p style={K({ fontWeight: 400, fontSize: 15, color: "var(--cream-70)", lineHeight: 1.6, maxWidth: 380 })}>
              Radio en Temuco desde 1960. Grupo Radios Araucana y La Frontera: 95.9 FM y 1110 AM, en vivo y en digital.
            </p>
            <ul aria-label="Redes sociales" style={{ listStyle: "none", display: "flex", gap: 8 }}>
              {SOC_LINKS.map(({ key, label, href, Icon }) => (
                <li key={key}><a href={href} target="_blank" rel="noopener noreferrer me" className="icon-btn" aria-label={`Radio Araucana en ${label}`}><Icon /></a></li>
              ))}
            </ul>
            <address style={K({ fontStyle: "normal", fontWeight: 400, fontSize: 14, color: "var(--cream-70)", lineHeight: 1.8 })}>
              {SETTINGS.address}<br />
              <a href={`tel:${(SETTINGS.adminPhone || "").replace(/\s/g, "")}`} className="footer-link" style={{ minHeight: 0 }}>{SETTINGS.adminPhone}</a> · {SETTINGS.adminHours}<br />
              <a href="/contacto" className="footer-link" style={{ minHeight: 0, color: "var(--green)" }}>Escríbenos por el formulario de contacto →</a>
            </address>
          </div>

          <nav className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8" aria-label="Enlaces del sitio">
            {FOOTER_LINKS.map((g) => (
              <div key={g.title}>
                <h2 style={K({ fontWeight: 700, fontSize: 12, color: "var(--cream)", textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 10 })}>{g.title}</h2>
                <ul style={{ listStyle: "none" }}>
                  {g.links.map((l) => (
                    <li key={l.label}><a href={l.href} className="footer-link" style={K({ fontSize: 15 })}>{l.label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div style={{ borderTop: "1px solid var(--line)", padding: "20px 0 22px", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <p style={K({ fontWeight: 400, fontSize: 13, color: "var(--cream-55)" })}>© 2026 Radios Araucana y La Frontera · Temuco, Chile</p>
          <a href="/frontera" className="footer-link" style={{ minHeight: 0, fontSize: 13 }}>Radio La Frontera 1110 AM · desde 1939</a>
        </div>
      </div>
    </footer>
  );
}

/* ─── WhatsApp Widget ─────────────────────────────────────────────────────── */
const SvgWhatsApp = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function WhatsAppWidget() {
  const { settings, whatsappOptions: WA_OPTIONS } = useSiteContent();
  const WA_NUMBER = settings.whatsappNumber;
  const [open, setOpen] = useState(false);
  const openChat = (opt) => {
    const number = opt.wa ?? WA_NUMBER;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(opt.msg)}`, "_blank", "noopener,noreferrer");
  };
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {open && (
        <div className="wa-panel" role="dialog" aria-label="Escríbenos por WhatsApp" style={{ position: "fixed", bottom: 92, right: 20, zIndex: 9998, width: 300, borderRadius: 14, overflow: "hidden", boxShadow: "0 12px 48px rgba(0,0,0,0.4)", fontFamily: "var(--font)" }}>
          <div style={{ background: "#075E54", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#128C7E", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><SvgWhatsApp size={20} /></div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: "#fff", lineHeight: 1.2 }}>Radio Araucana 95.9</p>
                <p style={{ fontWeight: 400, fontSize: 11, color: "rgba(255,255,255,0.8)" }}>Normalmente responde en minutos</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Cerrar" style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={18} /></button>
          </div>
          <div style={{ background: "#ECE5DD", padding: "14px 16px 6px" }}>
            <div style={{ background: "#fff", borderRadius: "0 8px 8px 8px", padding: "10px 14px", display: "inline-block", boxShadow: "0 1px 2px rgba(0,0,0,0.1)", maxWidth: 240 }}>
              <p style={{ fontWeight: 400, fontSize: 13, color: "#191919", lineHeight: 1.45 }}>Hola, ¿en qué te ayudamos hoy?</p>
            </div>
          </div>
          <div style={{ background: "#ECE5DD", padding: "8px 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {WA_OPTIONS.map((opt, i) => (
              <button key={i} className="wa-opt" onClick={() => openChat(opt)} style={{ background: "#fff", border: "none", borderRadius: 8, padding: "11px 14px", display: "flex", alignItems: "center", gap: 10, textAlign: "left", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", width: "100%", minHeight: 44 }}>
                <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>{opt.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 13, color: "#075E54" }}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {!open && (
        <div style={{ position: "fixed", bottom: 92, right: 20, zIndex: 9997, display: "flex", alignItems: "center", gap: 10 }}>
          <div className="hidden sm:block" aria-hidden="true" style={{ background: "var(--ink-3)", border: "1px solid var(--line-strong)", borderRadius: 10, padding: "8px 12px", boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}>
            <p style={K({ fontWeight: 700, fontSize: 12, color: "var(--cream)", whiteSpace: "nowrap" })}>Cotiza tu publicidad</p>
            <p style={K({ fontWeight: 400, fontSize: 11, color: "var(--green)", whiteSpace: "nowrap" })}>Escríbenos por WhatsApp →</p>
          </div>
          <button className="wa-fab" onClick={() => setOpen(true)} aria-label="Escríbenos por WhatsApp" style={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0, background: "#25D366", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 6px 20px rgba(37,211,102,0.4)" }}>
            <SvgWhatsApp size={28} />
          </button>
        </div>
      )}
    </>
  );
}

/* ─── Floating audio player ───────────────────────────────────────────────── */
function FloatingPlayer({ station, play }) {
  const [muted, setMuted] = useState(false);
  const playing = station !== null;
  const isFrontera = station === "frontera";
  const toggleMute = () => { const a = document.querySelector("audio"); if (a) a.muted = !muted; setMuted(!muted); };
  const toggle = () => play(isFrontera ? "frontera" : "araucana");
  const share = () => {
    const name = isFrontera ? "Radio La Frontera 1110 AM" : "Radio Araucana 95.9 FM";
    const text = `Escucha ${name} en vivo: https://radioaraucana.cl/`;
    if (navigator.share) { navigator.share({ title: name, text, url: "https://radioaraucana.cl/" }).catch(() => {}); return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noreferrer");
  };
  const accent = isFrontera ? "#9BD57A" : "var(--green)";

  return (
    <div role="region" aria-label="Reproductor de radio en vivo" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999, background: "rgba(17,19,17,.9)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderTop: "1px solid var(--line-strong)", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: playing ? "rgba(82,184,112,.15)" : "rgba(246,243,238,.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 6 }}>
          {isFrontera ? <img src="/frontera-logo-white.svg" alt="" width="32" height="32" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <LogoSVG height={26} color="#F6F3EE" />}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={K({ fontWeight: 700, fontSize: 13, color: "var(--cream)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" })}>
            {isFrontera ? "Radio La Frontera 1110 AM" : "Radio Araucana 95.9 FM"}
          </p>
          <p style={K({ fontWeight: 700, fontSize: 11, color: playing ? accent : "var(--cream-55)", letterSpacing: "0.1em", textTransform: "uppercase" })} aria-live="polite">
            {playing ? "Al aire" : "En pausa"}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className="hidden sm:block"><Waveform color={playing ? accent : "#3a3f3a"} height={20} /></span>
        <button className="btn btn-red" onClick={toggle} aria-pressed={playing}
          aria-label={playing ? `Pausar ${isFrontera ? "Radio La Frontera" : "Radio Araucana"}` : `Reproducir ${isFrontera ? "Radio La Frontera 1110 AM" : "Radio Araucana 95.9 FM"}`}
          style={{ width: 52, height: 52, minHeight: 52, padding: 0, borderRadius: "50%", boxShadow: "0 8px 24px rgba(215,38,30,.35)" }}>
          {playing ? <Pause size={22} aria-hidden="true" /> : <Play size={22} fill="#fff" aria-hidden="true" style={{ marginLeft: 3 }} />}
        </button>
        <span className="hidden sm:block"><Waveform color={playing ? accent : "#3a3f3a"} height={20} /></span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button onClick={toggleMute} className="icon-btn" aria-label={muted ? "Activar sonido" : "Silenciar"} aria-pressed={muted} style={{ border: "none", color: muted ? "var(--cream-55)" : "var(--cream)" }}>
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <button onClick={share} className="icon-btn" aria-label="Compartir la radio" style={{ border: "none" }}><Share2 size={20} /></button>
      </div>
    </div>
  );
}

/* ─── App ─────────────────────────────────────────────────────────────────── */
function AppInner() {
  const { settings } = useSiteContent();
  const STREAM_URL = settings.streamAraucana;
  const STREAM_FRONTERA = settings.streamFrontera;
  const [station, setStation] = useState(null); // null | "araucana" | "frontera"
  const [modal, setModal] = useState(null); // { video, vertical }
  const audioRef = useRef(null);
  const yt = useYouTube();

  const play = (which) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (station === which) { audio.pause(); setStation(null); return; }
    audio.pause();
    audio.src = which === "araucana" ? STREAM_URL : STREAM_FRONTERA;
    audio.load();
    const p = audio.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
    setStation(which);
  };
  const openVideo = useCallback((video, vertical) => setModal({ video, vertical }), []);
  const closeVideo = useCallback(() => setModal(null), []);
  const navigateVideo = useCallback((v) => setModal((m) => ({ video: v, vertical: Boolean(m?.vertical) })), []);

  const araucanaPlaying = station === "araucana";
  const toggleAraucana = () => play("araucana");

  return (
    <>
      <a href="#inicio" className="skip-link">Saltar al contenido</a>
      <audio ref={audioRef} preload="none" />
      <GlobalStyles />
      <Header playing={araucanaPlaying} toggle={toggleAraucana} />
      <main id="contenido" style={{ paddingBottom: 72 }}>
        <Hero playing={araucanaPlaying} toggle={toggleAraucana} latest={yt.episodes[0]} />
        <WeatherTicker />
        <PodcastSection data={yt} onPlay={openVideo} />
        <ReelsSection data={yt} onPlay={openVideo} />
        <NewsGrid />
        <ProgramSchedule playing={araucanaPlaying} toggle={toggleAraucana} />
        <SocialSection />
        <RegionalStories />
        <FronteraSection playing={station === "frontera"} toggle={() => play("frontera")} />
        <AboutSection />
        <Footer />
      </main>
      <FloatingPlayer station={station} play={play} />
      <WhatsAppWidget />
      {modal && (
        <VideoModal
          video={modal.video}
          vertical={modal.vertical}
          onClose={closeVideo}
          playlist={modal.vertical ? yt.shorts : yt.episodes}
          onNavigate={navigateVideo}
        />
      )}
    </>
  );
}

export default function App() {
  const [content, setContent] = useState(defaultContent);
  useEffect(() => {
    let alive = true;
    fetch("/api/content", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (alive && data && typeof data === "object" && data.settings) setContent(data); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return (
    <SiteContentContext.Provider value={content}>
      <AppInner />
    </SiteContentContext.Provider>
  );
}
