import React from "react";
import { useParams, Link } from "react-router-dom";
import { T, FONTS } from "../theme.js";
import { Card, Button, Badge } from "../components/ui.jsx";

export default function Confirmacion() {
  const { orderNumber } = useParams();
  return (
    <section style={{ padding: "60px 20px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Card style={{ padding: 32, textAlign: "center" }}>
          <Badge tone="primary" style={{ marginBottom: 18 }}>Pago confirmado</Badge>
          <h1
            className="display"
            style={{ fontSize: "clamp(28px, 4vw, 38px)", color: T.greenDark, marginBottom: 12 }}
          >
            Tu solicitud quedó agendada
          </h1>
          <p style={{ color: T.inkSoft, fontSize: 16, lineHeight: 1.55, marginBottom: 22 }}>
            Te enviamos un email con todos los detalles. El día de la difusión la radio
            emitirá tu aviso 3 veces y al día hábil siguiente recibirás el certificado.
          </p>
          <div
            style={{
              background: T.cream,
              border: `1px dashed ${T.border}`,
              borderRadius: 8,
              padding: "16px 20px",
              marginBottom: 24,
              display: "inline-block",
            }}
          >
            <span className="mono" style={{ fontSize: 12, color: T.inkSoft, letterSpacing: 0.4, textTransform: "uppercase" }}>
              N° de orden
            </span>
            <div className="mono" style={{ fontSize: 26, color: T.greenDark, fontWeight: 600, marginTop: 4 }}>
              {orderNumber ?? "RLF-XXXX-XXXX"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/">
              <Button variant="outline">Volver al inicio</Button>
            </Link>
          </div>
          <p style={{ marginTop: 24, fontSize: 12, color: T.inkMute }}>
            ¿Dudas? Escríbenos a <a href="mailto:secretaria.araucana@gmail.com" style={{ color: T.greenDark }}>secretaria.araucana@gmail.com</a>.
          </p>
        </Card>
      </div>
    </section>
  );
}
