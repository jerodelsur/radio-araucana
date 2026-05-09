import React, { useState } from "react";
import { Link } from "react-router-dom";
import { T } from "../../theme.js";
import { Card, Field, Input, Button, Badge } from "../../components/ui.jsx";
import { useAuth } from "../../lib/auth.jsx";

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!email.trim()) {
      setResult({ type: "error", text: "Ingresa tu email." });
      return;
    }
    setSubmitting(true);
    setResult(null);
    const res = await requestPasswordReset(email.trim());
    setSubmitting(false);
    if (!res.ok) {
      setResult({ type: "error", text: res.error || "No pudimos enviar el email." });
      return;
    }
    // Por seguridad, mostramos siempre el mismo mensaje exista o no la cuenta
    // (no revelamos qué emails están registrados).
    setResult({
      type: "ok",
      text: "Si esa cuenta existe, te enviamos un email con un link para restablecer tu contraseña. Revisa tu bandeja (y la de spam por las dudas).",
    });
  }

  return (
    <section style={{ padding: "60px 20px" }}>
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <Card>
          <Badge tone="warn" style={{ marginBottom: 16 }}>Recuperar acceso</Badge>
          <h1 className="display" style={{ fontSize: 26, color: T.greenDark, marginBottom: 6 }}>
            ¿Olvidaste tu contraseña?
          </h1>
          <p style={{ color: T.inkSoft, fontSize: 14, marginBottom: 22, lineHeight: 1.5 }}>
            Ingresa el email con el que tienes acceso al panel y te mandamos un
            link para crear una contraseña nueva.
          </p>
          <form onSubmit={handleSubmit}>
            <Field label="Email" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="gerencia@araucanayfrontera.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </Field>
            {result && (
              <div
                role={result.type === "ok" ? "status" : "alert"}
                style={{
                  fontSize: 13,
                  background: result.type === "ok" ? "rgba(78,165,82,0.10)" : "rgba(197,62,31,0.08)",
                  border: `1px solid ${result.type === "ok" ? "rgba(78,165,82,0.4)" : "rgba(197,62,31,0.30)"}`,
                  color: result.type === "ok" ? T.greenDark : T.danger,
                  borderRadius: 6,
                  padding: "10px 12px",
                  marginBottom: 14,
                  lineHeight: 1.5,
                }}
              >
                {result.text}
              </div>
            )}
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              style={{ width: "100%" }}
              loading={submitting}
              disabled={submitting}
            >
              {submitting ? "Enviando…" : "Enviar link de recuperación"}
            </Button>
          </form>
          <div style={{ textAlign: "center", marginTop: 18 }}>
            <Link to="/admin/login" style={{ fontSize: 13, color: T.greenDark }}>
              ← Volver al login
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
