import React from "react";
import { T } from "../../theme.js";
import { Card, Badge } from "../../components/ui.jsx";

export default function AdminPlaceholder({ title, description }) {
  return (
    <section style={{ padding: "40px 20px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <Card>
          <Badge tone="warn" style={{ marginBottom: 14 }}>Pendiente — Fase 1 + Supabase</Badge>
          <h1 className="display" style={{ fontSize: 26, color: T.greenDark, marginBottom: 8 }}>
            {title}
          </h1>
          <p style={{ color: T.inkSoft, fontSize: 14, lineHeight: 1.55, maxWidth: 640 }}>
            {description}
          </p>
        </Card>
      </div>
    </section>
  );
}
