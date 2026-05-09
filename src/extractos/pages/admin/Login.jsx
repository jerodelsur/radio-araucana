import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import { T } from "../../theme.js";
import { Card, Field, Input, Button, Badge } from "../../components/ui.jsx";
import { useAuth } from "../../lib/auth.jsx";

export default function AdminLogin() {
  const { isAdmin, loading: authLoading, authError, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = location.state?.from?.pathname || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Si ya está autenticado, redirigimos directo.
  if (!authLoading && isAdmin) {
    return <Navigate to={fromPath} replace />;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setLocalError(null);
    if (!email.trim() || !password) {
      setLocalError("Ingresa email y contraseña.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await signIn(email.trim(), password);
      if (!res.ok) {
        setLocalError(res.error || "No pudimos iniciar sesión.");
        return;
      }
      // El AuthProvider validará que el user tenga fila en admin_users.
      // Damos un beat para que se actualice y luego redirigimos.
      setTimeout(() => navigate(fromPath, { replace: true }), 80);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={{ padding: "60px 20px" }}>
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <Card>
          <Badge tone="warn" style={{ marginBottom: 16 }}>Acceso interno</Badge>
          <h1 className="display" style={{ fontSize: 28, color: T.greenDark, marginBottom: 6 }}>
            Ingresa al panel
          </h1>
          <p style={{ color: T.inkSoft, fontSize: 14, marginBottom: 22, lineHeight: 1.5 }}>
            Solo personal autorizado. Si no tienes cuenta, pídele a la Gerencia
            que cree tu usuario.
          </p>
          <form onSubmit={handleSubmit}>
            <Field label="Email" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder="administracion@araucanayfrontera.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </Field>
            <Field label="Contraseña" htmlFor="password" required>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {(localError || authError) && (
              <div
                role="alert"
                style={{
                  fontSize: 13,
                  color: T.danger,
                  background: "rgba(197,62,31,0.08)",
                  border: "1px solid rgba(197,62,31,0.30)",
                  borderRadius: 6,
                  padding: "10px 12px",
                  marginBottom: 14,
                  lineHeight: 1.5,
                }}
              >
                {localError || authError}
              </div>
            )}
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              style={{ width: "100%" }}
              loading={submitting || authLoading}
              disabled={submitting || authLoading}
            >
              {submitting ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Link to="/admin/forgot-password" style={{ fontSize: 13, color: T.greenDark }}>
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
