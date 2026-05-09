import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { T, FONTS } from "../../theme.js";
import { Card, Field, Input, Select, Button, Badge } from "../../components/ui.jsx";
import { useAuth } from "../../lib/auth.jsx";
import { getSupabaseBrowser } from "../../lib/supabase-browser.js";
import {
  STATUS_LABELS,
  STATUS_ORDER,
  statusLabel,
  statusTone,
  procedureLabel,
  formatCLPSimple,
  formatShortDate,
  formatTimestamp,
} from "../../lib/order-helpers.js";

const PAGE_SIZE = 50;

export default function AdminDashboard() {
  const { adminProfile, signOut } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all_active");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);

    (async () => {
      const supabase = getSupabaseBrowser();
      let q = supabase
        .from("orders")
        .select("order_number, status, client_name, client_email, comuna, region, line_count, amount_clp, resolved_publication_date, created_at")
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (statusFilter === "all_active") {
        // Estados "activos" = todo lo que no es completado/cancelado.
        // Usamos .in() explícito porque .not("status","in",...) tiene quirks en supabase-js.
        q = q.in("status", [
          "draft",
          "pending_payment",
          "paid",
          "scheduled",
          "broadcast_complete",
          "certificate_generated",
          "certificate_sent",
          "payment_failed",
        ]);
      } else if (statusFilter !== "all") {
        q = q.eq("status", statusFilter);
      }

      try {
        const { data, error } = await Promise.race([
          q,
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout: la consulta tardó más de 10s.")), 10000)),
        ]);
        if (!alive) return;
        if (error) {
          console.error("[Dashboard] error cargando órdenes:", error);
          setErr(error.message);
          setOrders([]);
        } else {
          setOrders(data || []);
        }
      } catch (e) {
        if (!alive) return;
        console.error("[Dashboard] excepción:", e);
        setErr(e?.message || "Error al cargar órdenes.");
        setOrders([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [statusFilter, refreshKey]);

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const term = search.trim().toLowerCase();
    return orders.filter((o) =>
      [o.order_number, o.client_name, o.client_email, o.comuna]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [orders, search]);

  const counts = useMemo(() => {
    const c = {};
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  return (
    <section style={{ padding: "32px 20px 60px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
          <div>
            <Badge tone="primary" style={{ marginBottom: 8 }}>Panel admin</Badge>
            <h1 className="display" style={{ fontSize: 28, color: T.greenDark, marginBottom: 4 }}>
              Órdenes de extractos
            </h1>
            <p style={{ fontSize: 13, color: T.inkSoft }}>
              Sesión: {adminProfile?.full_name || "—"} · {adminProfile?.role}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="ghost" size="sm" type="button" onClick={() => setRefreshKey((k) => k + 1)}>
              ↻ Actualizar
            </Button>
            <Button variant="ghost" size="sm" type="button" onClick={signOut}>
              Cerrar sesión
            </Button>
          </div>
        </header>

        {/* Filtros */}
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 14, alignItems: "end" }}>
            <Field label="Buscar" hint="Por N° de orden, nombre, email o comuna." htmlFor="search">
              <Input
                id="search"
                placeholder="RLF-2026-… / nombre / email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Field>
            <Field label="Estado" htmlFor="statusFilter">
              <Select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all_active">Activas (excluye completadas/canceladas)</option>
                <option value="all">Todas</option>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>

        {/* Resumen rápido */}
        {!loading && orders.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 16,
              fontSize: 12,
              color: T.inkSoft,
            }}
          >
            {STATUS_ORDER.filter((s) => counts[s]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                style={{
                  background: statusFilter === s ? T.greenDark : "transparent",
                  color: statusFilter === s ? T.cream : T.inkSoft,
                  border: `1px solid ${statusFilter === s ? T.greenDark : T.border}`,
                  borderRadius: 999,
                  padding: "5px 12px",
                  cursor: "pointer",
                  fontSize: 11,
                  fontFamily: FONTS.mono,
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                }}
              >
                {STATUS_LABELS[s]} · {counts[s]}
              </button>
            ))}
          </div>
        )}

        {/* Tabla */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: "center", color: T.inkSoft }}>Cargando órdenes…</div>
          ) : err ? (
            <div style={{ padding: 30, color: T.danger }}>
              Error: {err}
              <br />
              <span style={{ fontSize: 12, color: T.inkSoft }}>
                Verifica que tu usuario esté en <code>public.admin_users</code> y que las RLS estén bien configuradas.
              </span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: T.inkSoft }}>
              {search.trim() ? "Sin coincidencias para tu búsqueda." : "Sin órdenes que mostrar todavía."}
            </div>
          ) : (
            <OrdersTable orders={filtered} />
          )}
        </Card>
      </div>
    </section>
  );
}

function OrdersTable({ orders }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
        }}
      >
        <thead>
          <tr style={{ background: T.cream, color: T.inkSoft }}>
            <Th>N° orden</Th>
            <Th>Cliente</Th>
            <Th>Comuna</Th>
            <Th>Difusión</Th>
            <Th align="right">Líneas</Th>
            <Th align="right">Monto</Th>
            <Th>Estado</Th>
            <Th>Recibida</Th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr
              key={o.order_number}
              style={{ borderTop: `1px solid ${T.border}`, transition: "background 80ms ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(78,165,82,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Td>
                <Link
                  to={`/admin/orden/${encodeURIComponent(o.order_number)}`}
                  className="mono"
                  style={{ color: T.greenDark, fontWeight: 600, textDecoration: "none" }}
                >
                  {o.order_number}
                </Link>
              </Td>
              <Td>
                <div style={{ color: T.ink }}>{o.client_name}</div>
                <div style={{ fontSize: 11, color: T.inkMute }}>{o.client_email}</div>
              </Td>
              <Td>{o.comuna}<div style={{ fontSize: 11, color: T.inkMute }}>{o.region}</div></Td>
              <Td>{formatShortDate(o.resolved_publication_date)}</Td>
              <Td align="right">{o.line_count}</Td>
              <Td align="right" className="mono">{formatCLPSimple(o.amount_clp)}</Td>
              <Td><Badge tone={statusTone(o.status)}>{statusLabel(o.status)}</Badge></Td>
              <Td>{formatTimestamp(o.created_at)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, align = "left" }) {
  return (
    <th
      style={{
        textAlign: align,
        padding: "10px 14px",
        fontWeight: 600,
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        borderBottom: `1px solid ${T.border}`,
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
        padding: "12px 14px",
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
