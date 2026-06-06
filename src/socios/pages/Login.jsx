import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

export default function Login() {
  const { signIn, isSocio, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!loading && isSocio) navigate("/socios", { replace: true });
  }, [loading, isSocio, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await signIn(email.trim(), password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
    } else {
      navigate("/socios", { replace: true });
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#F6F3EE] flex items-center justify-center px-4 py-16">

      {/* Grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.025,
        }}
      />

      <div
        className="w-full max-w-sm"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 700ms cubic-bezier(0.32,0.72,0,1), transform 700ms cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        {/* Outer shell (double-bezel) */}
        <div className="rounded-[2rem] bg-[#EDE9E2] p-2 ring-1 ring-black/5">
          {/* Inner core */}
          <div
            className="rounded-[calc(2rem-0.5rem)] bg-white px-8 py-10"
            style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9), 0 20px 60px rgba(26,15,10,0.08)" }}
          >
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#B91C1C] flex items-center justify-center mb-4 shadow-lg shadow-red-900/20">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="white" strokeWidth="1.5">
                  <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  <path d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                </svg>
              </div>
              <span className="text-[10px] uppercase tracking-[0.22em] font-medium text-[#B91C1C] mb-1">
                Radio Araucana
              </span>
              <h1 className="text-[1.35rem] font-700 text-[#18110C] tracking-tight leading-tight">
                Panel de Socios
              </h1>
              <p className="text-sm text-[#9C8E85] mt-1">Acceso restringido</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#4A3F38] tracking-wide uppercase">
                  Correo electrónico
                </label>
                <div className="rounded-xl bg-[#F6F3EE] ring-1 ring-[#DDD8CF] px-4 py-3 focus-within:ring-[#B91C1C]/50 transition-all duration-300"
                  style={{ transition: "box-shadow 300ms cubic-bezier(0.32,0.72,0,1)" }}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="tu@correo.cl"
                    className="w-full bg-transparent text-sm text-[#18110C] placeholder:text-[#BDB5AD] outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#4A3F38] tracking-wide uppercase">
                  Contraseña
                </label>
                <div className="rounded-xl bg-[#F6F3EE] ring-1 ring-[#DDD8CF] px-4 py-3 focus-within:ring-[#B91C1C]/50">
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm text-[#18110C] placeholder:text-[#BDB5AD] outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Button */}
              <button
                type="submit"
                disabled={submitting}
                className="group mt-1 flex items-center justify-between w-full rounded-full bg-[#18110C] px-5 py-3.5 text-white text-sm font-medium
                  active:scale-[0.98] disabled:opacity-60"
                style={{ transition: "transform 200ms cubic-bezier(0.32,0.72,0,1), background 200ms" }}
              >
                <span>{submitting ? "Verificando…" : "Ingresar al panel"}</span>
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105"
                  style={{ transition: "transform 300ms cubic-bezier(0.32,0.72,0,1)" }}
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" className="w-3.5 h-3.5">
                    <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-[#BDB5AD] mt-6">
          Información confidencial — solo socios autorizados
        </p>
      </div>
    </div>
  );
}
