import React from "react";
import { useParams, Link } from "react-router-dom";
import { T, FONTS } from "../theme.js";
import { Card, Button, Badge } from "../components/ui.jsx";
import { useSettings } from "../lib/settings-store.js";

export default function Confirmacion() {
  const { orderNumber } = useParams();
  const settings = useSettings();
  const adminEmail = settings.radio_email_administration || "administracion@araucanayfrontera.cl";
  const supportEmail = settings.radio_email_secretary || "secretaria.araucana@gmail.com";
  const bankName = settings.radio_bank_name || "Banco Santander";
  const accountType = settings.radio_bank_account_type || "Cuenta Corriente";
  const accountNum = settings.radio_bank_account_number || "0-000-9874438-0";
  const legalName = settings.radio_legal_name || "Sociedad Comercial de Radiodifusión y Publicidad del Sur Limitada";
  const legalRut = settings.radio_legal_rut || "79.966.670-7";

  return (
    <section style={{ padding: "60px 20px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <Card style={{ padding: 32 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Badge tone="warn" style={{ marginBottom: 18 }}>Beta · pago por transferencia</Badge>
            <h1
              className="display"
              style={{ fontSize: "clamp(28px, 4vw, 38px)", color: T.greenDark, marginBottom: 12 }}
            >
              Recibimos tu solicitud
            </h1>
            <p style={{ color: T.inkSoft, fontSize: 16, lineHeight: 1.55 }}>
              Te enviamos un email con todos los detalles. Para que la difusión
              quede agendada en firme, transfiere el monto a la cuenta de la radio
              indicando el N° de orden.
            </p>
          </div>

          <div
            style={{
              background: T.cream,
              border: `1px dashed ${T.border}`,
              borderRadius: 8,
              padding: "16px 20px",
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            <span className="mono" style={{ fontSize: 12, color: T.inkSoft, letterSpacing: 0.4, textTransform: "uppercase" }}>
              N° de orden
            </span>
            <div className="mono" style={{ fontSize: 28, color: T.greenDark, fontWeight: 600, marginTop: 4 }}>
              {orderNumber ?? "RLF-XXXX-XXXX"}
            </div>
          </div>

          <h2 className="display" style={{ fontSize: 18, color: T.greenDark, marginBottom: 10, fontWeight: 500 }}>
            Datos para transferir
          </h2>
          <div
            style={{
              background: "#fff",
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              padding: "16px 18px",
              fontFamily: FONTS.mono,
              fontSize: 13,
              lineHeight: 1.7,
              color: T.ink,
              marginBottom: 16,
            }}
          >
            <strong>{legalName}</strong>
            <br />
            RUT: {legalRut}
            <br />
            {bankName} — {accountType}
            <br />
            N° de cuenta: <strong>{accountNum}</strong>
            <br />
            Email confirmación pago: {adminEmail}
          </div>
          <p style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.55, marginBottom: 18 }}>
            Importante: incluye el N° de orden <strong>{orderNumber}</strong> en
            el comentario de la transferencia. Cuando recibamos el pago,
            confirmamos por email (normalmente menos de 24 horas hábiles) y la
            radio agenda la difusión.
          </p>

          <div
            style={{
              padding: 14,
              background: "rgba(78,165,82,0.06)",
              border: "1px solid rgba(78,165,82,0.25)",
              borderRadius: 8,
              fontSize: 12.5,
              color: T.inkSoft,
              lineHeight: 1.55,
              marginBottom: 18,
            }}
          >
            <strong style={{ color: T.greenDark }}>Qué pasa después:</strong> el día agendado, la radio difunde el aviso 3 veces. Al día hábil siguiente recibes el certificado de difusión y la factura electrónica al email de facturación que indicaste.
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/">
              <Button variant="outline">Volver al cotizador</Button>
            </Link>
          </div>
          <p style={{ marginTop: 20, fontSize: 12, color: T.inkMute, textAlign: "center" }}>
            ¿Dudas? Escríbenos a <a href={`mailto:${supportEmail}`} style={{ color: T.greenDark }}>{supportEmail}</a>.
          </p>
        </Card>
      </div>
    </section>
  );
}
