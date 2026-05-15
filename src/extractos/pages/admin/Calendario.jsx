// Calendario quincenal admin (Bertha, 2026-05-15).
//
// Vista por fecha de difusión (1 o 15 del mes resuelto). Muestra los extractos
// agrupados por horario A/B con sus posiciones internas (1..24). Sirve para
// preparar el día de aire y emitir los certificados.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { T, FONTS } from "../../theme.js";
import { Card, Button, Badge, Select } from "../../components/ui.jsx";
import { useAuth } from "../../lib/auth.jsx";
import { getSupabaseBrowser } from "../../lib/supabase-browser.js";
import { TIME_BLOCKS, BLOCK_CAPACITY } from "../../lib/time-blocks.js";
import {
  procedureLabel,
  formatCLPSimple,
  formatLongDate,
} from "../../lib/order-helpers.js";

const MESES_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
                  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

// Lista de fechas relevantes: próximas 6 fechas de difusión (1 o 15 de cada
// mes desde hoy hasta 3 meses adelante).
function upcomingPublicationDates(now = new Date()) {
  const out = [];
  let y = now.getFullYear();
  let m = now.getMonth(); // 0-indexed
  const today = new Date(y, m, now.getDate());
  for (let i = 0; i < 6; i++) {
    for (const day of [1, 15]) {
      const date = new Date(y, m, day);
      if (date >= today) {
        const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        out.push({ iso, day, monthIndex: m, year: y });
      }
    }
    m += 1;
    if (m > 11) { m = 0; y += 1; }
  }
  return out;
}

function humanDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} de ${MESES_ES[m - 1]} de ${y}`;
}

export default function AdminCalendario() {
  const { adminProfile } = useAuth();
  const upcoming = useMemo(() => upcomingPublicationDates(), []);
  const [selectedDate, setSelectedDate] = useState(upcoming[0]?.iso);
  const [extracts, setExtracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true);
    setErr(null);
    const supabase = getSupabaseBrowser();
    try {
      const { data, error } = await supabase
        .from("order_extracts")
        .select("id, extract_index, time_block, time_block_position, line_count, amount_clp, comuna, region, procedure_type, status, extract_text, order_id, orders!inner(order_number, client_name, client_email, status, amount_clp, billing_legal_name)")
        .eq("resolved_publication_date", selectedDate)
        .order("time_block", { ascending: true })
        .order("time_block_position", { ascending: true })
        .order("extract_index", { ascending: true });
      if (error) {
        setErr(error.message);
        setExtracts([]);
      } else {
        setExtracts(data || []);
      }
    } catch (e) {
      setErr(e?.message || "Error al cargar.");
      setExtracts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, refreshKey]);

  useEffect(() => { reload(); }, [reload]);

  const byBlock = useMemo(() => {
    const groups = { A: [], B: [], unassigned: [] };
    for (const e of extracts) {
      if (e.time_block === "A") groups.A.push(e);
      else if (e.time_block === "B") groups.B.push(e);
      else groups.unassigned.push(e);
    }
    return groups;
  }, [extracts]);

  const totalPaid = useMemo(() => {
    return extracts
      .filter((e) => ["paid", "scheduled", "broadcast_complete", "certificate_generated", "certificate_sent", "completed"].includes(e.orders?.status))
      .reduce((sum, e) => sum + (e.amount_clp || 0), 0);
  }, [extracts]);

  return (
    <section style={{ padding: "32px 20px 60px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
          <div>
            <Badge tone="primary" style={{ marginBottom: 8 }}>Panel admin</Badge>
            <h1 className="display" style={{ fontSize: 28, color: T.greenDark, marginBottom: 4 }}>
              Calendario de difusión
            </h1>
            <p style={{ fontSize: 13, color: T.inkSoft }}>
              Extractos agrupados por horario A/B para la fecha seleccionada.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link to="/admin" style={{ color: T.inkSoft, fontSize: 13, textDecoration: "none", padding: "8px 14px" }}>
              ← Panel
            </Link>
            <Button variant="ghost" size="sm" type="button" onClick={() => setRefreshKey((k) => k + 1)}>
              ↻ Actualizar
            </Button>
          </div>
        </header>

        <Card style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <label style={{ fontSize: 13, color: T.inkSoft }} htmlFor="dateSelect">
              Fecha de difusión:
            </label>
            <Select
              id="dateSelect"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ minWidth: 260 }}
            >
              {upcoming.map((slot) => (
                <option key={slot.iso} value={slot.iso}>
                  {humanDate(slot.iso)}
                </option>
              ))}
            </Select>
            <div style={{ marginLeft: "auto", fontSize: 13, color: T.inkSoft }}>
              {extracts.length} {extracts.length === 1 ? "extracto" : "extractos"} en total ·{" "}
              <span style={{ color: T.greenDark, fontWeight: 600 }}>{formatCLPSimple(totalPaid)} cobrado</span>
            </div>
          </div>
        </Card>

        {loading ? (
          <Card style={{ padding: 60, textAlign: "center", color: T.inkSoft }}>Cargando…</Card>
        ) : err ? (
          <Card style={{ padding: 30, color: T.danger }}>Error: {err}</Card>
        ) : extracts.length === 0 ? (
          <Card style={{ padding: 60, textAlign: "center", color: T.inkSoft }}>
            Sin extractos agendados para esta fecha.
          </Card>
        ) : (
          <>
            <BlockTable
              blockId="A"
              title="Horario A — 08:00, 10:00, 12:00"
              rows={byBlock.A}
              capacity={BLOCK_CAPACITY}
            />
            <div style={{ height: 18 }} />
            <BlockTable
              blockId="B"
              title="Horario B — 09:00, 11:00, 13:00"
              rows={byBlock.B}
              capacity={BLOCK_CAPACITY}
            />
            {byBlock.unassigned.length > 0 && (
              <>
                <div style={{ height: 18 }} />
                <Card style={{ padding: 16 }}>
                  <h2 className="display" style={{ fontSize: 16, color: T.warn, marginBottom: 10, fontWeight: 500 }}>
                    Sin horario asignado ({byBlock.unassigned.length})
                  </h2>
                  <p style={{ fontSize: 12, color: T.inkSoft, marginBottom: 10 }}>
                    Estas órdenes todavía no están pagadas o tu día de A+B se llenó y quedaron pendientes.
                  </p>
                  <ExtractRowList rows={byBlock.unassigned} showPosition={false} />
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function BlockTable({ blockId, title, rows, capacity }) {
  const filled = rows.length;
  const remaining = capacity - filled;
  const overflow = filled > capacity;
  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          padding: "14px 18px",
          background: T.cream,
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h2 className="display" style={{ fontSize: 17, color: T.greenDark, fontWeight: 500, margin: 0 }}>
          {title}
        </h2>
        <span
          className="mono"
          style={{
            fontSize: 12,
            color: overflow ? T.danger : remaining === 0 ? T.warn : T.inkSoft,
            fontWeight: 600,
          }}
        >
          {filled}/{capacity} cupos {overflow ? "· sobre tope ⚠" : remaining === 0 ? "· lleno" : `· quedan ${remaining}`}
        </span>
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: 30, textAlign: "center", color: T.inkSoft, fontSize: 13 }}>
          Sin extractos en este horario aún.
        </div>
      ) : (
        <ExtractRowList rows={rows} showPosition />
      )}
    </Card>
  );
}

function ExtractRowList({ rows, showPosition }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ color: T.inkSoft, background: T.cream }}>
            {showPosition && <Th style={{ width: 50 }}>#</Th>}
            <Th>Orden</Th>
            <Th>Cliente</Th>
            <Th>Comuna</Th>
            <Th>Trámite</Th>
            <Th align="right">Líneas</Th>
            <Th align="right">Monto</Th>
            <Th>Estado</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr
              key={e.id}
              style={{ borderTop: `1px solid ${T.border}` }}
            >
              {showPosition && (
                <Td>
                  <span
                    className="mono"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: T.greenDark,
                      background: "rgba(78,165,82,0.10)",
                      padding: "2px 8px",
                      borderRadius: 999,
                    }}
                  >
                    {e.time_block_position}
                  </span>
                </Td>
              )}
              <Td>
                <Link
                  to={`/admin/orden/${encodeURIComponent(e.orders?.order_number || "")}`}
                  className="mono"
                  style={{ color: T.greenDark, fontWeight: 600, textDecoration: "none" }}
                >
                  {e.orders?.order_number}
                </Link>
                <div style={{ fontSize: 11, color: T.inkMute }}>#{e.extract_index}</div>
              </Td>
              <Td>
                <div style={{ color: T.ink }}>{e.orders?.client_name}</div>
                <div style={{ fontSize: 11, color: T.inkMute }}>{e.orders?.billing_legal_name}</div>
              </Td>
              <Td>{e.comuna}<div style={{ fontSize: 11, color: T.inkMute }}>{e.region}</div></Td>
              <Td>
                <span style={{ fontSize: 12 }}>{procedureLabel(e.procedure_type)}</span>
              </Td>
              <Td align="right">{e.line_count}</Td>
              <Td align="right" className="mono">{formatCLPSimple(e.amount_clp)}</Td>
              <Td>
                <Badge tone={statusToneShort(e.status)} style={{ fontSize: 10 }}>
                  {statusLabelShort(e.status)}
                </Badge>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function statusToneShort(s) {
  return {
    scheduled: "neutral",
    broadcast_complete: "primary",
    certificate_generated: "accent",
    certificate_sent: "accent",
    cancelled: "warn",
  }[s] || "neutral";
}
function statusLabelShort(s) {
  return {
    scheduled: "Agendado",
    broadcast_complete: "Difundido",
    certificate_generated: "Certif. generado",
    certificate_sent: "Certif. enviado",
    cancelled: "Cancelado",
  }[s] || s;
}

function Th({ children, align = "left", style: extra }) {
  return (
    <th
      style={{
        textAlign: align,
        padding: "10px 14px",
        fontWeight: 600,
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        borderBottom: `1px solid ${T.border}`,
        ...(extra || {}),
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, align = "left", ...rest }) {
  return (
    <td
      style={{
        padding: "10px 14px",
        verticalAlign: "top",
        textAlign: align,
        color: T.ink,
      }}
      {...rest}
    >
      {children}
    </td>
  );
}
