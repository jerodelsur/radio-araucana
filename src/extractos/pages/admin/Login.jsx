import React from "react";
import { T, FONTS } from "../../theme.js";
import { Card, Field, Input, Button, Badge } from "../../components/ui.jsx";

// Placeholder F1: la integración real con Supabase Auth llega cuando estén las
// credenciales (ver tarea BLOCKER en TODO).
export default function AdminLogin() {
  return (
    <section style={{ padding: "60px 20px" }}>
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <Card>
          <Badge tone="warn" style={{ marginBottom: 16 }}>Acceso interno</Badge>
          <h1 className="display" style={{ fontSize: 28, color: T.greenDark, marginBottom: 6 }}>
            Ingresa al panel
          </h1>
          <p style={{ color: T.inkSoft, fontSize: 14, marginBottom: 22, lineHeight: 1.5 }}>
            Solo personal autorizado. La autenticación se conecta con Supabase Auth
            cuando estén cargadas las credenciales.
          </p>
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              alert("Auth Supabase pendiente: necesitamos las credenciales para activar el login.");
            }}
          >
            <Field label="Email" htmlFor="email" required>
              <Input id="email" type="email" placeholder="secretaria@araucana.cl" autoComplete="email" />
            </Field>
            <Field label="Contraseña" htmlFor="password" required>
              <Input id="password" type="password" autoComplete="current-password" />
            </Field>
            <Button type="submit" variant="secondary" size="lg" style={{ width: "100%" }}>
              Ingresar
            </Button>
          </form>
        </Card>
      </div>
    </section>
  );
}
