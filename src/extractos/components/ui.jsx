import React, { forwardRef } from "react";
import { T, FONTS, S } from "../theme.js";

/* ─── Card ────────────────────────────────────────────────────────────────── */
export function Card({ children, style, ...rest }) {
  return (
    <div
      style={S(
        {
          background: "#fff",
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          padding: 22,
          boxShadow: "0 1px 0 rgba(15, 35, 18, 0.04)",
        },
        style,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ─── Field (label + input + helper/error) ────────────────────────────────── */
export function Field({ label, hint, error, htmlFor, children, required }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
      {label && (
        <label
          htmlFor={htmlFor}
          style={{
            fontFamily: FONTS.body,
            fontSize: 13,
            fontWeight: 600,
            color: T.ink,
            letterSpacing: 0.1,
          }}
        >
          {label}
          {required && <span style={{ color: T.terracota, marginLeft: 4 }} aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span style={{ fontSize: 12, color: T.danger, fontWeight: 500 }}>{error}</span>
      ) : hint ? (
        <span style={{ fontSize: 12, color: T.inkMute }}>{hint}</span>
      ) : null}
    </div>
  );
}

/* ─── Input ───────────────────────────────────────────────────────────────── */
const baseInputStyle = {
  fontFamily: FONTS.body,
  fontSize: 15,
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${T.border}`,
  background: "#fff",
  color: T.ink,
  outline: "none",
  transition: "border-color .15s ease, box-shadow .15s ease",
  width: "100%",
  lineHeight: 1.4,
};

export const Input = forwardRef(function Input({ invalid, style, ...rest }, ref) {
  return (
    <input
      ref={ref}
      style={S(baseInputStyle, invalid && { borderColor: T.danger }, style)}
      onFocus={(e) => {
        e.target.style.borderColor = invalid ? T.danger : T.green;
        e.target.style.boxShadow = `0 0 0 3px ${invalid ? "rgba(197,62,31,0.12)" : "rgba(78,165,82,0.18)"}`;
      }}
      onBlur={(e) => {
        e.target.style.borderColor = invalid ? T.danger : T.border;
        e.target.style.boxShadow = "none";
      }}
      {...rest}
    />
  );
});

/* ─── Textarea ────────────────────────────────────────────────────────────── */
export const Textarea = forwardRef(function Textarea({ invalid, style, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      style={S(baseInputStyle, { minHeight: 220, resize: "vertical", lineHeight: 1.5 }, invalid && { borderColor: T.danger }, style)}
      onFocus={(e) => {
        e.target.style.borderColor = invalid ? T.danger : T.green;
        e.target.style.boxShadow = `0 0 0 3px ${invalid ? "rgba(197,62,31,0.12)" : "rgba(78,165,82,0.18)"}`;
      }}
      onBlur={(e) => {
        e.target.style.borderColor = invalid ? T.danger : T.border;
        e.target.style.boxShadow = "none";
      }}
      {...rest}
    />
  );
});

/* ─── Select nativo (con look custom) ─────────────────────────────────────── */
export const Select = forwardRef(function Select({ invalid, children, style, ...rest }, ref) {
  return (
    <select
      ref={ref}
      style={S(
        baseInputStyle,
        {
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%231a3a1e' d='M6 8 0 0h12z'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          backgroundSize: "10px 7px",
          paddingRight: 32,
        },
        invalid && { borderColor: T.danger },
        style,
      )}
      onFocus={(e) => {
        e.target.style.borderColor = invalid ? T.danger : T.green;
        e.target.style.boxShadow = `0 0 0 3px ${invalid ? "rgba(197,62,31,0.12)" : "rgba(78,165,82,0.18)"}`;
      }}
      onBlur={(e) => {
        e.target.style.borderColor = invalid ? T.danger : T.border;
        e.target.style.boxShadow = "none";
      }}
      {...rest}
    >
      {children}
    </select>
  );
});

/* ─── Button ──────────────────────────────────────────────────────────────── */
export function Button({ variant = "primary", size = "md", loading, disabled, children, style, ...rest }) {
  const sizeStyles = {
    sm: { padding: "8px 14px", fontSize: 13 },
    md: { padding: "12px 20px", fontSize: 15 },
    lg: { padding: "14px 26px", fontSize: 16 },
  }[size];

  const variantStyles = {
    primary: {
      background: T.terracota,
      color: "#fff",
      border: `1px solid ${T.terracota}`,
    },
    secondary: {
      background: T.greenDark,
      color: T.cream,
      border: `1px solid ${T.greenDark}`,
    },
    outline: {
      background: "transparent",
      color: T.greenDark,
      border: `1px solid ${T.greenDark}`,
    },
    ghost: {
      background: "transparent",
      color: T.greenDark,
      border: "1px solid transparent",
    },
  }[variant];

  return (
    <button
      disabled={disabled || loading}
      style={S(
        {
          fontFamily: FONTS.body,
          fontWeight: 600,
          letterSpacing: 0.2,
          borderRadius: 8,
          cursor: disabled || loading ? "not-allowed" : "pointer",
          opacity: disabled || loading ? 0.6 : 1,
          transition: "transform .05s ease, opacity .15s ease, background .15s ease",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        },
        sizeStyles,
        variantStyles,
        style,
      )}
      onMouseDown={(e) => { if (!disabled && !loading) e.currentTarget.style.transform = "translateY(1px)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          style={{
            width: 14,
            height: 14,
            border: "2px solid currentColor",
            borderRightColor: "transparent",
            borderRadius: "50%",
            display: "inline-block",
            animation: "extractos-spin 0.7s linear infinite",
          }}
        />
      )}
      {children}
    </button>
  );
}

/* ─── Badge (estados, etiquetas) ──────────────────────────────────────────── */
export function Badge({ tone = "neutral", children, style }) {
  const palette = {
    neutral: { bg: "#eef0e8", color: T.ink, border: "#d8d2bd" },
    primary: { bg: "rgba(78,165,82,0.12)", color: T.greenDark, border: "rgba(78,165,82,0.4)" },
    accent:  { bg: "rgba(181,72,30,0.10)", color: T.terracota, border: "rgba(181,72,30,0.35)" },
    warn:    { bg: "rgba(201,146,60,0.12)", color: T.warn, border: "rgba(201,146,60,0.4)" },
    danger:  { bg: "rgba(197,62,31,0.10)", color: T.danger, border: "rgba(197,62,31,0.35)" },
  }[tone];
  return (
    <span
      style={S(
        {
          display: "inline-block",
          fontFamily: FONTS.mono,
          fontSize: 11,
          padding: "3px 9px",
          borderRadius: 999,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          background: palette.bg,
          color: palette.color,
          border: `1px solid ${palette.border}`,
        },
        style,
      )}
    >
      {children}
    </span>
  );
}

/* ─── Modal de confirmación ───────────────────────────────────────────────── */
// Diálogo genérico que reemplaza window.confirm() con UX más clara para
// acciones que tienen efecto secundario importante (ej. enviar email al cliente).
//
// Props:
//   open: boolean
//   title: string
//   onCancel: () => void
//   onConfirm: () => void
//   confirmLabel: string  (default "Confirmar")
//   cancelLabel: string  (default "Cancelar")
//   tone: "primary" | "warn" | "danger"  (color del botón confirmar)
//   busy: boolean  (deshabilita botones mientras la acción se ejecuta)
//   children: contenido del modal (el cuerpo)

export function ConfirmDialog({
  open,
  title,
  onCancel,
  onConfirm,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "primary",
  busy = false,
  children,
}) {
  // Cerrar con Escape si no está procesando.
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape" && !busy) onCancel?.(); };
    window.addEventListener("keydown", handler);
    // Lock scroll del body mientras el modal está abierto.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  const confirmVariant = tone === "danger" ? "ghost" : "primary";
  const confirmStyle = tone === "danger"
    ? { background: T.danger, color: "#fff", borderColor: T.danger }
    : tone === "warn"
      ? { background: T.warn, color: "#fff", borderColor: T.warn }
      : undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(13,36,16,0.55)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        animation: "extractos-fadeUp 0.15s ease-out",
      }}
      onClick={(e) => {
        // No cerrar al click en backdrop si está procesando.
        if (busy) return;
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div
        style={{
          background: "#fff",
          maxWidth: 520,
          width: "100%",
          borderRadius: 12,
          boxShadow: "0 24px 60px rgba(13,36,16,0.30)",
          border: `1px solid ${T.border}`,
          padding: 24,
        }}
      >
        <h2
          id="confirm-dialog-title"
          className="display"
          style={{ fontSize: 20, color: T.greenDark, marginBottom: 14, fontWeight: 500 }}
        >
          {title}
        </h2>
        <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.55, marginBottom: 22 }}>
          {children}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Button variant="ghost" type="button" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            type="button"
            onClick={onConfirm}
            loading={busy}
            disabled={busy}
            style={confirmStyle}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Spinner CSS global ──────────────────────────────────────────────────── */
export const SpinnerStyles = () => (
  <style>{`@keyframes extractos-spin { to { transform: rotate(360deg); } }`}</style>
);
