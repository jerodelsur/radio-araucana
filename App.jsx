import React, { useState } from "react";
import { Menu, X, Play, Pause, Volume2, VolumeX, Share2 } from "lucide-react";

/* ─── Social SVGs ─────────────────────────────────────────────────────────── */
const SvgInstagram = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>;
const SvgTwitter  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
const SvgYoutube  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
const SvgFacebook = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
const SOC = [SvgInstagram, SvgYoutube, SvgFacebook];

/* ─── Official brand logo SVG (from araucanayfrontera.cl) ─────────────────── */
const LogoSVG = ({ height = 40, color = "#ffffff" }) => (
  <svg
    height={height}
    viewBox="0 0 600 274.21"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "block" }}
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
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Open Sans', sans-serif; background: #191919; }

    @keyframes livePulse {
      0%, 100% { transform: scale(1);   opacity: 1;   }
      50%       { transform: scale(1.4); opacity: 0.6; }
    }
    @keyframes waveform {
      from { transform: scaleY(0.25); }
      to   { transform: scaleY(1);    }
    }
    @keyframes marquee {
      from { transform: translateX(0);    }
      to   { transform: translateX(-50%); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0);    }
    }
    @keyframes signalRing {
      0%   { transform: scale(0.4); opacity: 0.7; }
      100% { transform: scale(2.6); opacity: 0;   }
    }

    .live-dot      { animation: livePulse 1.5s ease-in-out infinite; }
    .wave-bar      { animation: waveform 0.8s ease-in-out alternate infinite; transform-origin: bottom; }
    .marquee-track { animation: marquee 28s linear infinite; white-space: nowrap; display: inline-block; }

    .fiu-0 { animation: fadeInUp 0.6s ease forwards 0s;    opacity: 0; }
    .fiu-1 { animation: fadeInUp 0.6s ease forwards 0.15s; opacity: 0; }
    .fiu-2 { animation: fadeInUp 0.6s ease forwards 0.3s;  opacity: 0; }
    .fiu-3 { animation: fadeInUp 0.6s ease forwards 0.45s; opacity: 0; }
    .fiu-4 { animation: fadeInUp 0.6s ease forwards 0.6s;  opacity: 0; }

    .news-card { transition: transform 200ms ease, box-shadow 200ms ease; cursor: pointer; }
    .news-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.15); }
    .news-img { filter: contrast(1.08) saturate(0.82) brightness(0.96); transition: filter 300ms ease; }
    .news-card:hover .news-img { filter: contrast(1.05) saturate(0.95) brightness(1.0); }

    .video-card { transition: transform 200ms ease; cursor: pointer; }
    .video-card:hover { transform: scale(1.03); }

    .region-card { transition: transform 300ms ease, filter 300ms ease; cursor: pointer; }
    .region-card:hover { transform: scale(1.02); filter: brightness(1.1); }

    .prog-card { transition: transform 200ms ease; cursor: pointer; }
    .prog-card:hover { transform: scale(1.02); }

    .social-tile { position: relative; aspect-ratio: 1/1; cursor: pointer; overflow: hidden; border-radius: 3px; }
    .social-tile::after { content: ''; position: absolute; inset: 0; background: rgba(0,0,0,0.45); opacity: 0; transition: opacity 200ms ease; }
    .social-tile:hover::after { opacity: 1; }

    .sponsor-block { opacity: 0.55; transition: opacity 200ms ease; }
    .sponsor-block:hover { opacity: 1; }

    .footer-link { transition: color 150ms ease; }
    .footer-link:hover { color: #52b870 !important; }

    .nav-link { transition: color 150ms ease; }
    .nav-link:hover { color: #52b870 !important; }

    .social-icon-btn { transition: background 200ms ease; }
    .social-icon-btn:hover { background: #29623a !important; }

    .play-btn { transition: background 200ms ease; }
    .play-btn:hover { background: #29623a !important; }

    .cta-btn { transition: background 150ms ease, transform 120ms ease; }
    .cta-btn:hover { background: #aa0000 !important; transform: translateY(-1px); }

    ::-webkit-scrollbar { height: 4px; }
    ::-webkit-scrollbar-track { background: #191919; }
    ::-webkit-scrollbar-thumb { background: #29623a; border-radius: 2px; }
  `}</style>
);

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const K = (style) => ({ fontFamily: "'Open Sans', sans-serif", ...style });

const Waveform = ({ color = "#29623a", height = 24 }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height }}>
    {[0, 0.1, 0.2, 0.3, 0.4].map((d, i) => (
      <div key={i} className="wave-bar"
        style={{ width: 4, height, background: color, borderRadius: 2, animationDelay: `${d}s` }} />
    ))}
  </div>
);

/* ─── Live Placeholder ────────────────────────────────────────────────────── */
const LivePlaceholder = () => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
    {/* Looping background video */}
    <video
      autoPlay loop muted playsInline
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
    >
      <source src="/bg-placeholder.mp4" type="video/mp4" />
    </video>

    {/* Dark overlay so text is legible */}
    <div style={{ position: "absolute", inset: 0, background: "rgba(10,20,14,0.58)" }} />

    {/* Content */}
    <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
      {/* Animated signal rings */}
      <div style={{ position: "relative", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {[0, 0.5, 1.0].map((delay, i) => (
          <div key={i} style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: "1px solid rgba(82,184,112,0.6)",
            animation: `signalRing 2.4s ease-out ${delay}s infinite`,
          }} />
        ))}
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(41,98,58,0.85)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backdropFilter: "blur(4px)" }}>
          <Play size={20} color="#fff" fill="#fff" />
        </div>
      </div>

      <LogoSVG height={38} color="#ffffff" />

      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 6 }}>
        <p style={K({ fontWeight: 700, fontSize: 18, color: "#52b870", letterSpacing: "0.1em" })}>95.9 FM</p>
        <p style={K({ fontWeight: 400, fontSize: 13, color: "rgba(255,255,255,0.7)" })}>Sin transmisión en directo en este momento</p>
        <p style={K({ fontWeight: 300, fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 })}>Sintoniza el 95.9 FM en Temuco y la Araucanía</p>
      </div>
    </div>
  </div>
);

const CAT_COLORS = {
  REGIÓN: "#29623a", POLÍTICA: "#191919", CULTURA: "#4a7c59",
  DEPORTE: "#8B0000", ECONOMÍA: "#1a3a5c", SALUD: "#1a3a5c",
};
const Tag = ({ label }) => (
  <span style={K({ background: CAT_COLORS[label] ?? "#29623a", color: "#fff", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", padding: "2px 8px", borderRadius: 2, display: "inline-block" })}>{label}</span>
);

/* ─── Navbar ──────────────────────────────────────────────────────────────── */
function Navbar() {
  const [open, setOpen] = useState(false);
  const links = ["Inicio", "Noticias", "Programación", "Destinos", "En Vivo", "Contacto"];

  return (
    <nav style={{ background: "#191919", height: 64, position: "sticky", top: 0, zIndex: 1000, borderBottom: "1px solid #2d2d2d" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>

        {/* Official logo */}
        <a href="#" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <LogoSVG height={44} color="#ffffff" />
        </a>

        {/* Center nav */}
        <div className="hidden md:flex" style={{ gap: 28 }}>
          {links.map((l) => (
            <a key={l} href="#" className="nav-link" style={K({ fontWeight: 500, fontSize: 14, color: "#fff", textDecoration: "none" })}>{l}</a>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="live-dot" style={{ width: 10, height: 10, borderRadius: "50%", background: "#cc0000" }} />
            <span style={K({ fontWeight: 700, fontSize: 13, color: "#cc0000", textTransform: "uppercase", letterSpacing: "0.1em" })}>EN VIVO</span>
          </div>
          <button onClick={() => setOpen(!open)} className="md:hidden"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#fff" }}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden" style={{ background: "#191919", borderTop: "1px solid #2d2d2d", padding: "8px 24px 16px" }}>
          {links.map((l) => (
            <a key={l} href="#" style={K({ display: "block", fontWeight: 500, fontSize: 16, color: "#fff", textDecoration: "none", padding: "12px 0", borderBottom: "1px solid #2d2d2d" })}>{l}</a>
          ))}
        </div>
      )}
    </nav>
  );
}

/* ─── Hero ────────────────────────────────────────────────────────────────── */
function Hero({ playing, toggle }) {
  return (
    <section style={{
      background: "#191919",
      backgroundImage: "url(/mapuche.svg), repeating-linear-gradient(45deg, rgba(255,255,255,0.008) 0px, rgba(255,255,255,0.008) 1px, transparent 1px, transparent 22px)",
      backgroundSize: "60px 60px, auto",
      display: "flex", alignItems: "center", padding: "clamp(60px, 8vw, 120px) 24px",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%" }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="fiu-0" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="live-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#29623a" }} />
              <span style={K({ fontWeight: 600, fontSize: 12, color: "#52b870", textTransform: "uppercase", letterSpacing: "0.14em" })}>
                TRANSMITIENDO EN VIVO · 95.9 FM
              </span>
            </div>

            <h1 className="fiu-1" style={K({ fontWeight: 900, fontSize: "clamp(38px, 5.5vw, 72px)", color: "#fff", lineHeight: 1.04 })}>
              La radio histórica de<br />
              <span style={{ color: "#52b870" }}>Temuco y la Araucanía,</span><br />
              en directo.
            </h1>

            <p className="fiu-1" style={K({ fontWeight: 300, fontSize: 16, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, maxWidth: 440 })}>
              Las radios que han acompañado a Temuco y la Araucanía por generaciones. Más de 65 años siendo la voz de nuestra gente.
            </p>

            <div className="fiu-2" style={{ background: "#2d2d2d", borderLeft: "3px solid #29623a", padding: "16px 20px", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={K({ fontWeight: 700, fontSize: 16, color: "#fff" })}>Sube que Te Llevo</p>
                <p style={K({ fontWeight: 300, fontSize: 13, color: "#9ca3af", marginTop: 3 })}>Música y compañía · 06:00 – 10:00</p>
              </div>
              <Waveform />
            </div>

            <div className="fiu-3" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="cta-btn" onClick={toggle} style={K({ background: "#cc0000", color: "#fff", fontWeight: 700, fontSize: 15, padding: "12px 28px", borderRadius: 3, border: "none", cursor: "pointer", letterSpacing: "0.05em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 })}>
                {playing ? <Pause size={16} /> : <Play size={16} fill="#fff" />}
                {playing ? "En vivo — pausar" : "Escúchanos en el 95.9 FM"}
              </button>
            </div>
          </div>

          <div className="fiu-4" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ position: "relative", paddingBottom: "56.25%", borderRadius: 4, overflow: "hidden", boxShadow: "0 0 60px rgba(41,98,58,0.4)" }}>
              <LivePlaceholder />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
              <span style={K({ fontWeight: 400, fontSize: 13, color: "#9ca3af" })}>En vivo ahora</span>
              <Share2 size={14} color="#9ca3af" style={{ marginLeft: "auto", cursor: "pointer" }} />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ─── News Ticker ─────────────────────────────────────────────────────────── */
function NewsTicker() {
  const text = "ÚLTIMA HORA: Volcán Llaima mantiene alerta amarilla en La Araucanía · Deportes Temuco avanza en la Copa Chile · Festival Kimün llega a Padre Las Casas en junio · Temuco lidera ranking de calidad del aire en Chile · Comunidades mapuche de Ercilla inician diálogo con gobierno regional · Feria de artesanía mapuche bate récord de visitantes · Nueva ruta ciclista conectará Temuco con Padre Las Casas · ";
  return (
    <div style={{ background: "#29623a", padding: "10px 0", overflow: "hidden" }}>
      <div className="marquee-track">
        <span style={K({ fontWeight: 600, fontSize: 13, color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em" })}>
          {text}{text}
        </span>
      </div>
    </div>
  );
}

/* ─── News Grid ───────────────────────────────────────────────────────────── */
// Foto por categoría — reutilizable en cualquier noticia de ese tipo
const CAT_PHOTOS = {
  SALUD:    "https://d8j0ntlcm91z4.cloudfront.net/user_377BAP7O90tMrU9FnLhPLu2k6mH/hf_20260501_180129_e64ad2db-a604-455b-8b69-88fe1d8d309f.png",
  DEPORTE:  "https://d8j0ntlcm91z4.cloudfront.net/user_377BAP7O90tMrU9FnLhPLu2k6mH/hf_20260501_180959_7b7c4357-85f8-4af7-965c-be0ef00c58b9.png",
  CULTURA:  "https://d8j0ntlcm91z4.cloudfront.net/user_377BAP7O90tMrU9FnLhPLu2k6mH/hf_20260501_180240_485f5e65-1974-410b-9854-b7ef94957fa2.png",
  REGIÓN:   "https://d8j0ntlcm91z4.cloudfront.net/user_377BAP7O90tMrU9FnLhPLu2k6mH/hf_20260501_180247_518083b9-fa50-4ae4-b50d-dc3a605f8c92.png",
  POLÍTICA: "https://d8j0ntlcm91z4.cloudfront.net/user_377BAP7O90tMrU9FnLhPLu2k6mH/hf_20260501_180252_2f83fe1c-74ec-4e71-97dd-09b04075d485.png",

  ECONOMÍA: "https://d8j0ntlcm91z4.cloudfront.net/user_377BAP7O90tMrU9FnLhPLu2k6mH/hf_20260501_175448_69da918e-e045-48d0-88f2-88871ae9600d.png",
};

const NEWS = [
  {
    cat: "SALUD",
    headline: "La Araucanía ya tiene su primer gran centro especializado en salud infantil",
    bajada: "Un hospital pensado para los niños del sur de Chile abre sus puertas en la región. Escuchamos a quienes estuvieron en la inauguración.",
    time: "30 abr 2026",
  },
  {
    cat: "DEPORTE",
    headline: "Seis medallas se trae la Araucanía desde los Juegos Sudamericanos de la Juventud",
    bajada: "Los jóvenes deportistas regionales volvieron con el pecho lleno. Te contamos quiénes son y en qué disciplinas brillaron.",
    time: "30 abr 2026",
  },
  {
    cat: "CULTURA",
    headline: "El Teatro Municipal vibró con más de 600 bailarines en una noche para el recuerdo",
    bajada: "La danza tomó el centro de Temuco en un encuentro que reunió a elencos de toda la región durante una jornada única.",
    time: "30 abr 2026",
  },
  {
    cat: "REGIÓN",
    headline: "Cien jóvenes de la Araucanía reciben reconocimiento por transformar su entorno",
    bajada: "Desde el medioambiente hasta la cultura mapuche, los premiados muestran que el futuro de la región ya está en marcha.",
    time: "30 abr 2026",
  },
  {
    cat: "REGIÓN",
    headline: "Millonaria inversión busca sacar el transporte público de la Araucanía del siglo pasado",
    bajada: "Buses eléctricos y rutas modernizadas son parte del plan que el gobierno presentó esta semana para la movilidad regional.",
    time: "30 abr 2026",
  },
  {
    cat: "POLÍTICA",
    headline: "El Presidente habló fuerte sobre salud: qué prometió y qué inquieta al sector",
    bajada: "Dirigentes de la salud se reunieron con Kast para plantear sus dudas. Radio Araucana estuvo ahí para contarlo.",
    time: "30 abr 2026",
  },
];

function NewsGrid() {
  return (
    <section style={{ background: "#f4f4f4", padding: "64px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ borderLeft: "4px solid #29623a", paddingLeft: 12, marginBottom: 32 }}>
          <h2 style={K({ fontWeight: 800, fontSize: 28, color: "#191919", textTransform: "uppercase", letterSpacing: "0.02em" })}>Lo Más Reciente</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {NEWS.map((n, i) => {
            const photo = CAT_PHOTOS[n.cat];
            return (
              <article key={i} className="news-card" style={{ background: "#fff", borderRadius: 4, overflow: "hidden" }}>
                {/* Foto de categoría */}
                <div className="news-img" style={{ height: 200, position: "relative", backgroundImage: photo ? `url(${photo})` : undefined, background: photo ? undefined : "#2d2d2d", backgroundSize: "cover", backgroundPosition: "center" }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 60%)" }} />
                  <div style={{ position: "absolute", top: 12, left: 12 }}>
                    <Tag label={n.cat} />
                  </div>
                </div>
                {/* Texto */}
                <div style={{ padding: "16px 18px 20px" }}>
                  <h3 style={K({ fontWeight: 700, fontSize: 17, color: "#191919", lineHeight: 1.3, marginBottom: 8 })}>{n.headline}</h3>
                  <p style={K({ fontWeight: 300, fontSize: 14, color: "#6b7280", lineHeight: 1.55, marginBottom: 12 })}>{n.bajada}</p>
                  <span style={K({ fontWeight: 300, fontSize: 12, color: "#9ca3af" })}>Redacción Araucana · {n.time}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Video Section ───────────────────────────────────────────────────────── */
const VIDEOS = [
  { title: "Reportaje: El agua que escasea en La Araucanía",       dur: "12:34",   views: "8.2K vistas",  bg: "linear-gradient(135deg, #0f2d1a, #1a3a5c)" },
  { title: "Machi Francisca Linconao habla en Radio Araucana",     dur: "24:11",   views: "15.7K vistas", bg: "linear-gradient(135deg, #2d1a0f, #5c4033)" },
  { title: "80 años de la radio más antigua del sur de Chile",     dur: "45:02",   views: "32.1K vistas", bg: "linear-gradient(135deg, #1d4a2b, #29623a)" },
  { title: "En vivo: Marcha por derechos mapuche, Temuco",         dur: "1:23:45", views: "6.8K vistas",  bg: "linear-gradient(135deg, #1a1a1a, #2d2d2d)" },
];

function VideoSection() {
  return (
    <section style={{ background: "#191919", padding: "64px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <h2 style={K({ fontWeight: 900, fontSize: "clamp(28px, 4vw, 52px)", color: "#fff", marginBottom: 40, letterSpacing: "-0.01em" })}>
          EN DIRECTO Y EN VIDEO
        </h2>

        <div style={{ maxWidth: 800, margin: "0 auto 48px" }}>
          <div style={{ position: "relative", paddingBottom: "56.25%", borderRadius: 4, overflow: "hidden", boxShadow: "0 0 80px rgba(41,98,58,0.5)" }}>
            <LivePlaceholder />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
            <span style={K({ fontWeight: 500, fontSize: 14, color: "#52b870" })}>En vivo ahora · 95.9 FM</span>
            <Share2 size={16} color="#fff" style={{ marginLeft: 12, cursor: "pointer" }} />
          </div>
        </div>

        <p style={K({ fontWeight: 600, fontSize: 16, color: "rgba(255,255,255,0.5)", marginBottom: 16 })}>Últimos videos</p>
        <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 12 }}>
          {VIDEOS.map((v, i) => (
            <div key={i} className="video-card" style={{ minWidth: 260, flexShrink: 0 }}>
              <div style={{ position: "relative", paddingBottom: "56.25%", background: v.bg, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.92)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Play size={20} color="#29623a" fill="#29623a" />
                  </div>
                </div>
                <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(25,25,25,0.82)", borderRadius: 2, padding: "2px 7px" }}>
                  <span style={K({ fontWeight: 600, fontSize: 11, color: "#fff" })}>{v.dur}</span>
                </div>
              </div>
              <p style={K({ fontWeight: 600, fontSize: 14, color: "#fff", lineHeight: 1.3, marginTop: 8, marginBottom: 4 })}>{v.title}</p>
              <span style={K({ fontWeight: 300, fontSize: 12, color: "#6b7280" })}>{v.views}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Program Schedule ────────────────────────────────────────────────────── */
const PROGRAMS = [
  { start: "06:00", end: "10:00", name: "Sube que Te Llevo",         host: "Alejandro Contreras",              color: "#29623a" },
  { start: "10:00", end: "13:00", name: "La Gran Manada",            host: "Miguel Ángel Contreras",           color: "#4a7c59" },
  { start: "13:30", end: "14:30", name: "La Voz Albiverde",          host: "Mariela González · Lun, Mié, Vie", color: "#8B0000" },
  { start: "15:00", end: "16:00", name: "Contra el Reloj",           host: "Cristian Neira",                   color: "#1a3a5c" },
  { start: "16:00", end: "18:00", name: "Tarde a Tarde de Clásicos", host: "Luis Vega",                        color: "#5c4033" },
  { start: "18:00", end: "20:00", name: "Al Fondo a la Derecha",     host: "Rolando Gómez",                    color: "#4a7c59" },
];

const toMinutes = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

function getCurrentProgram() {
  const parts = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find(p => p.type === "hour").value);
  const m = Number(parts.find(p => p.type === "minute").value);
  const cur = h * 60 + m;
  return PROGRAMS.findIndex(p => cur >= toMinutes(p.start) && cur < toMinutes(p.end));
}

function ProgramSchedule() {
  const [activeIdx, setActiveIdx] = useState(getCurrentProgram);

  // Re-check every minute
  React.useEffect(() => {
    const id = setInterval(() => setActiveIdx(getCurrentProgram()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section style={{ background: "#fff", padding: "64px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <h2 style={K({ fontWeight: 800, fontSize: 32, color: "#191919", marginBottom: 32, letterSpacing: "0.01em" })}>
          PROGRAMACIÓN DE HOY
        </h2>

        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16 }}>
          {PROGRAMS.map((p, i) => {
            const active = i === activeIdx;
            return (
              <div key={i} className="prog-card" style={{
                minWidth: 172, padding: 14, borderRadius: 4,
                border: active ? "2px solid #29623a" : "1px solid #e5e7eb",
                background: active ? "#29623a" : "#fff",
                flexShrink: 0, position: "relative", paddingBottom: 18,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  {active && <div className="live-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", flexShrink: 0 }} />}
                  <span style={K({ fontWeight: 700, fontSize: 13, color: active ? "#fff" : "#29623a" })}>{p.start} – {p.end}</span>
                </div>
                <p style={K({ fontWeight: 600, fontSize: 14, color: active ? "#fff" : "#191919", lineHeight: 1.25, marginBottom: 4 })}>{p.name}</p>
                <p style={K({ fontWeight: 300, fontSize: 11, color: active ? "rgba(255,255,255,0.8)" : "#9ca3af" })}>{p.host}</p>
                {!active && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: p.color, borderRadius: "0 0 4px 4px" }} />}
              </div>
            );
          })}
        </div>

        {activeIdx === -1 && (
          <p style={K({ fontWeight: 400, fontSize: 14, color: "#9ca3af", marginTop: 12 })}>Sin programa en este horario</p>
        )}
      </div>
    </section>
  );
}

/* ─── Regional Stories ────────────────────────────────────────────────────── */
const REGIONS = [
  {
    name: "Araucanía Andina",
    sub: "Montañas, cultura y aventura al pie del Volcán Llaima",
    img: "https://araucanayfrontera.cl/wp-content/uploads/2021/09/Noticias-Araucana-ANDINA.jpg",
    body: [
      "La Araucanía Andina es la puerta de entrada norte a la Región de La Araucanía. Este territorio de montañas atrae a aventureros, amantes de los deportes de invierno y quienes buscan parques nacionales y el patrimonio mapuche-pehuenche.",
      "El Volcán Llaima es el rasgo geográfico dominante, anclando uno de los destinos más impresionantes de Chile: el Parque Nacional Conguillío. Esta área alberga bosques de araucarias milenarias, lagunas de origen glaciar, senderos de trekking, avistamiento de aves y presencia cultural indígena.",
      "Las actividades disponibles incluyen esquí en centros de invierno como Las Araucarias, recorridos por los senderos de Conguillío para contemplar el contraste entre flujos de lava y vegetación, visitas a comunidades que ofrecen turismo cultural, y la experiencia de ríos y aguas termales rodeados de montañas.",
      "El destino atrae tanto a quienes buscan aventura como a quienes desean reconectarse con una naturaleza prístina e inalterada.",
    ],
  },
  {
    name: "Costa Araucana",
    sub: "Donde la naturaleza y la cultura mapuche se encuentran con el mar",
    img: "https://araucanayfrontera.cl/wp-content/uploads/2021/09/Noticias-Araucana-COSTA.jpg",
    body: [
      "La Costa Araucanía es un destino inexplorado y sorprendente. Se extiende desde el borde costero del sur de Chile hasta zonas interiores donde las raíces del pueblo Mapuche Lafkenche permanecen fuertes, viviendo en profunda conexión con el mar (lafken significa mar en mapudungun).",
      "Este destino ofrece una experiencia única que combina playas prístinas, humedales, bosques costeros y comunidades que mantienen vivas sus tradiciones. Lugares como Puerto Saavedra, Toltén, Carahue y la zona del Lago Budi son ideales para quienes buscan un turismo con sentido: más cercano, auténtico y respetuoso con el entorno.",
      "Entre las actividades principales destacan: pasear por playas tranquilas y poco intervenidas, degustar la gastronomía local basada en mariscos, algas y productos nativos, vivir el turismo rural y etnoturismo junto a familias Mapuche-Lafkenche, y explorar rutas y espacios patrimoniales como el Museo del Budi.",
    ],
  },
  {
    name: "Araucanía Lacustre",
    sub: "Entre lagos, volcanes y tradición mapuche",
    img: "https://araucanayfrontera.cl/wp-content/uploads/2021/09/Noticias-Araucana-ARAUCANIA.jpg",
    body: [
      "La Araucanía Lacustre es uno de los destinos más encantadores del sur de Chile, ubicado al pie de la cordillera de los Andes. La región cuenta con imponentes volcanes, bosques nativos, aguas termales naturales y lagos de origen glaciar.",
      "Ciudades como Pucón, Villarrica, Lican Ray y Curarrehue combinan naturaleza prístina con infraestructura turística de primer nivel para el descanso, la aventura y el turismo familiar.",
      "El área representa territorio ancestral mapuche donde la cultura indígena permanece viva. Los visitantes pueden realizar tours culturales, visitar comunidades, conocer rucas tradicionales, aprender sobre la cosmovisión mapuche y degustar la cocina regional.",
      "El destino atrae durante todo el año: el invierno invita a las termas y centros de esquí como el Volcán Villarrica; el verano ofrece lagos, playas y senderos de montaña para quienes buscan aire fresco y desconexión.",
    ],
  },
  {
    name: "Temuco",
    sub: "Corazón urbano de la Araucanía",
    img: "https://araucanayfrontera.cl/wp-content/uploads/2021/09/Noticias-Araucana-TEMUCO.jpg",
    body: [
      "Temuco es una ciudad moderna y vibrante, considerada el corazón urbano de la Región de La Araucanía. Fundada en 1881 como fuerte militar, se ha transformado en un importante centro cultural, comercial y universitario del sur de Chile.",
      "La ciudad representa un punto de encuentro entre la cultura mapuche y la tradición europea de sus colonos, diversidad que se expresa en su arquitectura, gastronomía y su gente.",
      "Entre sus atractivos destacan el Mercado Municipal, el Museo Regional, el parque Cerro Ñielol y una creciente escena de cafés, ferias y eventos culturales que la convierten en una ciudad dinámica y acogedora.",
      "Temuco funciona como una excelente base para explorar los alrededores: desde Pucón y Villarrica, hasta la Araucanía Andina o la Costa Mapuche, todos a un par de horas de distancia.",
    ],
  },
];

function ArticleModal({ region, onClose }) {
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(10,15,12,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 8, maxWidth: 720, width: "100%", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
        {/* Hero image */}
        <div style={{ position: "relative", height: 280, flexShrink: 0 }}>
          <img src={region.img} alt={region.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }} />
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
            <X size={18} />
          </button>
          <div style={{ position: "absolute", bottom: 20, left: 24, right: 24 }}>
            <h2 style={K({ fontWeight: 900, fontSize: "clamp(22px, 4vw, 36px)", color: "#fff", lineHeight: 1.1, margin: 0 })}>{region.name}</h2>
            <p style={K({ fontWeight: 300, fontSize: 14, color: "rgba(255,255,255,0.85)", margin: "6px 0 0" })}>{region.sub}</p>
          </div>
        </div>
        {/* Body */}
        <div style={{ overflowY: "auto", padding: "32px 28px" }}>
          {region.body.map((p, i) => (
            <p key={i} style={K({ fontWeight: 400, fontSize: 16, color: "#374151", lineHeight: 1.75, marginBottom: 20 })}>{p}</p>
          ))}
          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 3, height: 20, background: "#29623a", borderRadius: 2 }} />
            <p style={K({ fontWeight: 500, fontSize: 13, color: "#6b7280", margin: 0 })}>Radio Araucana 95.9 FM — La voz histórica de Temuco y la Araucanía</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegionalStories() {
  const [active, setActive] = useState(null);

  return (
    <section style={{ background: "#191919", padding: "64px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <h2 style={K({ fontWeight: 900, fontSize: "clamp(22px, 3.5vw, 40px)", color: "#fff", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 40 })}>
          <span style={{ color: "#52b870" }}>NUESTRA</span> REGIÓN, NUESTRA CASA
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {REGIONS.map((r, i) => (
            <div key={i} className="region-card" onClick={() => setActive(r)} style={{ borderRadius: 4, minHeight: 380, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end", cursor: "pointer" }}>
              <img src={r.img} alt={r.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,20,14,0.92) 0%, rgba(10,20,14,0.3) 55%, transparent 100%)" }} />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundImage: "repeating-linear-gradient(90deg, #52b870 0px, #52b870 8px, transparent 8px, transparent 16px)" }} />
              <div style={{ position: "relative", zIndex: 1, padding: 20 }}>
                <h3 style={K({ fontWeight: 800, fontSize: "clamp(18px, 2.4vw, 30px)", color: "#fff", lineHeight: 1.1, marginBottom: 6 })}>{r.name}</h3>
                <p style={K({ fontWeight: 300, fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.4, marginBottom: 10 })}>{r.sub}</p>
                <span style={K({ fontWeight: 600, fontSize: 12, color: "#52b870" })}>Leer artículo →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {active && <ArticleModal region={active} onClose={() => setActive(null)} />}
    </section>
  );
}

/* ─── Social Feeds ────────────────────────────────────────────────────────── */
const SvgInstagramColor = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433"/>
        <stop offset="25%" stopColor="#e6683c"/>
        <stop offset="50%" stopColor="#dc2743"/>
        <stop offset="75%" stopColor="#cc2366"/>
        <stop offset="100%" stopColor="#bc1888"/>
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#ig)" strokeWidth="2"/>
    <circle cx="12" cy="12" r="4" stroke="url(#ig)" strokeWidth="2"/>
    <circle cx="17.5" cy="6.5" r="1" fill="#dc2743"/>
  </svg>
);
const SvgFacebookColor = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

function SocialFeeds() {
  return (
    <section style={{ background: "#f4f4f4", padding: "64px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 40 }}>
          <h2 style={K({ fontWeight: 800, fontSize: 32, color: "#191919", margin: 0 })}>SÍGUENOS</h2>
          <div style={{ display: "flex", gap: 10 }}>
            <a href="https://instagram.com/araucanaradio" target="_blank" rel="noreferrer"
              style={K({ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 13, color: "#191919", textDecoration: "none", background: "transparent", border: "1.5px solid #191919", padding: "8px 18px", borderRadius: 4 })}>
              <SvgInstagramColor />
              Seguir en Instagram
            </a>
            <a href="https://www.facebook.com/radioaraucana" target="_blank" rel="noreferrer"
              style={K({ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 13, color: "#191919", textDecoration: "none", background: "transparent", border: "1.5px solid #191919", padding: "8px 18px", borderRadius: 4 })}>
              <SvgFacebookColor />
              Seguir en Facebook
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

          {/* Instagram */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <SvgInstagramColor />
              <div>
                <p style={K({ fontWeight: 700, fontSize: 15, color: "#191919", margin: 0 })}>@araucanaradio</p>
                <p style={K({ fontWeight: 300, fontSize: 12, color: "#6b7280", margin: 0 })}>Instagram</p>
              </div>
            </div>
            <a href="https://instagram.com/araucanaradio" target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "block" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3, borderRadius: 6, overflow: "hidden", marginBottom: 14 }}>
                {[
                  "linear-gradient(135deg,#0f2d1a,#29623a)",
                  "linear-gradient(135deg,#0f1d2d,#1a3a5c)",
                  "linear-gradient(135deg,#2d4a1a,#4a7c59)",
                  "linear-gradient(135deg,#2d1a0f,#5c4033)",
                  "linear-gradient(135deg,#1a1a1a,#2d2d2d)",
                  "linear-gradient(135deg,#3a0f0f,#8B0000)",
                  "linear-gradient(135deg,#1d4a2b,#52b870)",
                  "linear-gradient(135deg,#0f2535,#1a4a5c)",
                  "linear-gradient(135deg,#2d2d1a,#5c5c1a)",
                ].map((g, i) => (
                  <div key={i} className="social-tile" style={{ background: g, aspectRatio: "1/1" }} />
                ))}
              </div>
            </a>
            <a href="https://instagram.com/araucanaradio" target="_blank" rel="noreferrer"
              style={K({ fontWeight: 600, fontSize: 13, color: "#52b870", textDecoration: "none" })}>Ver perfil completo →</a>
          </div>

          {/* Facebook Page Plugin */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <SvgFacebookColor />
              <div>
                <p style={K({ fontWeight: 700, fontSize: 15, color: "#191919", margin: 0 })}>radioaraucana</p>
                <p style={K({ fontWeight: 300, fontSize: 12, color: "#6b7280", margin: 0 })}>Facebook</p>
              </div>
            </div>
            <div style={{ borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb", background: "#fff" }}>
              <iframe
                src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fradioaraucana&tabs=timeline&width=500&height=480&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true"
                width="100%" height="480"
                style={{ border: "none", display: "block" }}
                scrolling="no"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ─── Sponsor Strip ───────────────────────────────────────────────────────── */
function SponsorStrip() {
  return (
    <div style={{ background: "#191919", padding: "28px 24px" }}>
      <p style={K({ fontWeight: 500, fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 })}>
        EMPRESAS QUE CONFÍAN EN NOSOTROS
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
        {["MALLPLAZA", "COPEC", "BCI", "SALCOBRAND", "SODIMAC"].map((s) => (
          <div key={s} className="sponsor-block" style={{ border: "1px solid rgba(41,98,58,0.4)", width: 120, height: 48, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={K({ fontWeight: 500, fontSize: 11, color: "#9ca3af", letterSpacing: "0.05em" })}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Footer ──────────────────────────────────────────────────────────────── */
const FOOTER_LINKS = [
  { title: "Radio",        links: ["Quiénes somos", "Historia", "Equipo", "Señal en vivo"] },
  { title: "Contenido",   links: ["Noticias", "Videos", "Destinos Araucanía", "Galería"] },
  { title: "Programación", links: ["Horarios", "Programas", "Conductores", "Archivo"] },
  { title: "Publicidad",  links: ["Cotiza tu campaña", "Tarifas", "Formatos", "Contacto"] },
];

function Footer() {
  return (
    <footer style={{ background: "#191919", padding: "64px 24px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">

          <div>
            <div style={{ marginBottom: 20 }}>
              <LogoSVG height={30} color="#ffffff" />
            </div>
            <p style={K({ fontWeight: 300, fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 8, lineHeight: 1.6 })}>
              Radio Araucana, acompañando a Temuco<br />y la Araucanía desde 1960.
            </p>
            <p style={K({ fontWeight: 600, fontSize: 13, color: "#52b870", marginBottom: 24 })}>Desde 1960 · Más de 65 años en el aire</p>

            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              {SOC.map((Icon, i) => (
                <button key={i} className="social-icon-btn"
                  style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(41,98,58,0.5)", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
                  <Icon />
                </button>
              ))}
            </div>

            {[
              "Caupolicán 110, Of. 2003, Temuco, IX Región",
              "+56 45 2213166",
              "contacto@araucanayfrontera.cl",
            ].map((t) => <p key={t} style={K({ fontWeight: 300, fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6 })}>{t}</p>)}
          </div>

          <div className="grid grid-cols-2 gap-8">
            {FOOTER_LINKS.map((g) => (
              <div key={g.title}>
                <h4 style={K({ fontWeight: 500, fontSize: 13, color: "#fff", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 })}>{g.title}</h4>
                {g.links.map((l) => (
                  <a key={l} href="#" className="footer-link"
                    style={K({ display: "block", fontWeight: 300, fontSize: 14, color: "rgba(255,255,255,0.6)", textDecoration: "none", marginBottom: 8 })}>{l}</a>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid #2d2d2d", padding: "20px 0", textAlign: "center" }}>
          <p style={K({ fontWeight: 300, fontSize: 12, color: "rgba(255,255,255,0.4)" })}>
            © 2026 Radios Araucana y La Frontera · Caupolicán 110, Temuco · Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─── WhatsApp Widget ─────────────────────────────────────────────────────── */
const WA_NUMBER = "56992872087";
const WA_OPTIONS = [
  { label: "Consulta general",       icon: "💬", msg: "Hola Radio Araucana, tengo una consulta y me gustaría que me ayuden." },
  { label: "Cotizar publicidad",     icon: "📢", msg: "Hola, me gustaría cotizar una pauta publicitaria en Radio Araucana 95.9 FM. ¿Podrían enviarme información de tarifas y formatos disponibles?" },
  { label: "Enviar una dedicatoria", icon: "🎵", msg: "Hola, me gustaría enviar una dedicatoria al aire en el 95.9 FM. " },
  { label: "Enviar una noticia",     icon: "📰", msg: "Hola, tengo información que podría ser de interés para Radio Araucana." },
];

const SvgWhatsApp = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function WhatsAppWidget() {
  const [open, setOpen] = useState(false);

  const openChat = (msg) => {
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <style>{`
        @keyframes waPop {
          from { opacity: 0; transform: scale(0.88) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);     }
        }
        .wa-panel { animation: waPop 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .wa-opt   { transition: background 150ms ease, transform 120ms ease; cursor: pointer; }
        .wa-opt:hover { background: #f0fdf4 !important; transform: translateX(3px); }
        .wa-fab   { transition: transform 180ms ease, box-shadow 180ms ease; }
        .wa-fab:hover { transform: scale(1.08); box-shadow: 0 8px 28px rgba(37,211,102,0.45) !important; }
      `}</style>

      {/* Panel */}
      {open && (
        <div className="wa-panel" style={{
          position: "fixed", bottom: 88, right: 20, zIndex: 9998,
          width: 300, borderRadius: 12, overflow: "hidden",
          boxShadow: "0 12px 48px rgba(0,0,0,0.22)",
          fontFamily: "'Open Sans', sans-serif",
        }}>
          {/* Header */}
          <div style={{ background: "#075E54", padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#128C7E", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                <SvgWhatsApp size={20} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: "#fff", margin: 0, lineHeight: 1.2 }}>Radio Araucana 95.9</p>
                <p style={{ fontWeight: 400, fontSize: 11, color: "rgba(255,255,255,0.7)", margin: 0 }}>Normalmente responde en minutos</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
          </div>

          {/* Bubble intro */}
          <div style={{ background: "#ECE5DD", padding: "14px 16px 6px" }}>
            <div style={{ background: "#fff", borderRadius: "0 8px 8px 8px", padding: "10px 14px", display: "inline-block", boxShadow: "0 1px 2px rgba(0,0,0,0.1)", maxWidth: 240 }}>
              <p style={{ fontWeight: 400, fontSize: 13, color: "#191919", margin: 0, lineHeight: 1.45 }}>
                Hola 👋 ¿En qué podemos ayudarte hoy?
              </p>
            </div>
          </div>

          {/* Options */}
          <div style={{ background: "#ECE5DD", padding: "8px 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {WA_OPTIONS.map((opt, i) => (
              <button key={i} className="wa-opt" onClick={() => openChat(opt.msg)}
                style={{ background: "#fff", border: "none", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, textAlign: "left", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", width: "100%" }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>{opt.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 13, color: "#075E54" }}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FAB */}
      <button className="wa-fab" onClick={() => setOpen(!open)} style={{
        position: "fixed", bottom: 88, right: 20, zIndex: 9997,
        width: 56, height: 56, borderRadius: "50%",
        background: "#25D366", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
        boxShadow: "0 4px 18px rgba(37,211,102,0.35)",
        ...(open && { display: "none" }),
      }}>
        <SvgWhatsApp size={28} />
      </button>
    </>
  );
}

/* ─── Floating Player ─────────────────────────────────────────────────────── */
const STREAM_URL = "/stream";

function FloatingPlayer({ playing, toggle }) {
  const [muted, setMuted] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleMute = () => {
    const audio = document.querySelector("audio");
    if (audio) audio.muted = !muted;
    setMuted(!muted);
  };

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: "Radio Araucana 95.9 FM", url: "https://radio-araucana.vercel.app" });
    } else {
      navigator.clipboard?.writeText("https://radio-araucana.vercel.app");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999, background: "#191919", backgroundImage: "url(/mapuche.svg)", backgroundSize: "60px 60px", borderTop: "2px solid #29623a", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>

      {/* Foto + info — oculto en móvil */}
      <div className="hidden sm:flex" style={{ alignItems: "center", gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 6, overflow: "hidden", flexShrink: 0, border: "1px solid #29623a" }}>
          <img src="/player-photo.png" alt="Radio Araucana" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
        </div>
        <div>
          <p style={K({ fontWeight: 700, fontSize: 13, color: "#fff", lineHeight: 1.2 })}>Radio Araucana 95.9 FM</p>
          <p style={K({ fontWeight: 300, fontSize: 11, color: "#9ca3af", lineHeight: 1.4 })}>Sube que Te Llevo · Alejandro Contreras</p>
          <p style={K({ fontWeight: 600, fontSize: 10, color: "#52b870", letterSpacing: "0.06em", textTransform: "uppercase" })}>En vivo</p>
        </div>
      </div>

      {/* Nombre en móvil */}
      <div className="flex sm:hidden" style={{ alignItems: "center", gap: 8 }}>
        <div style={{ width: 38, height: 38, borderRadius: 5, overflow: "hidden", flexShrink: 0, border: "1px solid #29623a" }}>
          <img src="/player-photo.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
        </div>
        <div>
          <span style={K({ fontWeight: 600, fontSize: 13, color: "#fff" })}>95.9 FM</span>
          <p style={K({ fontWeight: 300, fontSize: 10, color: "#52b870" })}>En vivo</p>
        </div>
      </div>

      {/* Play + waveform */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Waveform color={playing ? "#4ade80" : "#374151"} height={20} />
        <button className="play-btn" onClick={toggle}
          style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid #cc0000", background: playing ? "#cc0000" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          {playing ? <Pause size={18} color="#fff" /> : <Play size={18} color="#fff" fill="#fff" />}
        </button>
        <Waveform color={playing ? "#4ade80" : "#374151"} height={20} />
      </div>

      {/* Mute + compartir */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>

        {/* Botón mute — funciona en todos los dispositivos incluido iOS */}
        <button onClick={toggleMute}
          style={{ background: "none", border: "none", cursor: "pointer", color: muted ? "#6b7280" : "#fff", display: "flex", alignItems: "center", padding: 6 }}>
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {/* Compartir */}
        <div style={{ position: "relative" }}>
          {copied && (
            <div style={{ position: "absolute", bottom: 36, right: 0, background: "#29623a", borderRadius: 4, padding: "3px 8px", whiteSpace: "nowrap" }}>
              <span style={K({ fontSize: 11, color: "#fff" })}>¡Link copiado!</span>
            </div>
          )}
          <Share2 size={20} color="#fff" style={{ cursor: "pointer" }} onClick={share} />
        </div>
      </div>
    </div>
  );
}

/* ─── App ─────────────────────────────────────────────────────────────────── */
export default function App() {
  const [playing, setPlaying] = useState(false);
  const audioRef = React.useRef(null);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      audio.src = "";
    } else {
      audio.src = STREAM_URL;
      audio.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  return (
    <>
      <audio ref={audioRef} preload="none" />
      <GlobalStyles />
      <Navbar />
      <main style={{ paddingBottom: 64 }}>
        <Hero playing={playing} toggle={toggle} />
        <NewsTicker />
        <NewsGrid />
        <VideoSection />
        <ProgramSchedule />
        <RegionalStories />
        <SocialFeeds />
        <SponsorStrip />
        <Footer />
      </main>
      <FloatingPlayer playing={playing} setPlaying={setPlaying} toggle={toggle} />
      <WhatsAppWidget />
    </>
  );
}
