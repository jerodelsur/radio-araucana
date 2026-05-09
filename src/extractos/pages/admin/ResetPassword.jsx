import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { T } from "../../theme.js";
import { Card, Field, Input, Button, Badge } from "../../components/ui.jsx";
import { useAuth } from "../../lib/auth.jsx";

// Esta página se abre cuando el usuario hace clic en el link del email de
// recuperación. Supabase auto-inicia una sesión "recovery" que nos permite
// llamar a updateUser({ password }) sin pedir password actual.

export default function ResetPassword() {
  const { user, loading, updatePassword, signOut } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Si llega aquí sin sesión recovery, redirigimos a login.
  useEffect(() => {
    if (!loading && !user) {
      // Damos un beat por si Supabase aún está procesando el code de la URL.
      const t = setTimeout(() => {
        if (!user) {
          setResult({
            type: "error",
            text: "El link de recuperación no es válido o ya expiró. Pide uno nuevo.",
          });
        }
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [user, loading]);

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (password.length < 8) {
      setResult({ type: "error", text: "La contraseña debe tener al menos 8 caracteres." });
      return;
    }
    if (password !== confirm) {
      setResult({ type: "error", text: "Las contraseñas no coinciden." });
      return;
    }
    setSubmitting(true);
    setResult(null);
    const res = await updatePassword(password);
    setSubmitting(false);
    if (!res.ok) {
      setResult({ type: "error", text: res.error || "No pudimos actualizar la contraseña." });
      return;
    }
    setResult({ type: "ok", text: "Contraseña actualizada. Te llevamos al panel…" });
    // Después de updateUser, ya estamos logueados con la sesión nueva.
    // Esperamos 1s y enviamos a admin.
    setTimeout(() => navigate("/admin", { replace: true }), 1200);
  }

  return (
    <section style={{ padding: "60px 20px" }}>
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <Card>
          <Badge tone="warn" style={{ marginBottom: 16 }}>Nueva contraseña</Badge>
          <h1 className="display" style={{ fontSize: 26, color: T.greenDark, marginBottom: 6 }}>
            Crea tu contraseña
          </h1>
          <p style={{ color: T.inkSoft, fontSize: 14, marginBottom: 22, lineHeight: 1.5 }}>
            Mínimo 8 caracteres. Anótala en un lugar seguro (gestor de
            contraseñas, papel guardado, etc.).
          </p>
          <form onSubmit={handleSubmit}>
            <Field label="Nueva contraseña" htmlFor="password" required>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </Field>
            <Field label="Confirma la contraseña" htmlFor="confirm" required>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
              disabled={submitting || !user}
            >
              {submitting ? "Guardando…" : "Guardar contraseña"}
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
