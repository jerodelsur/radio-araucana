import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Cotizador from "./pages/Cotizador.jsx";
import Confirmacion from "./pages/Confirmacion.jsx";
import { T } from "./theme.js";

// Admin se lazy-loadea: el bundle del admin no se entrega a los visitantes
// del cotizador público.
const AdminLogin = lazy(() => import("./pages/admin/Login.jsx"));
const AdminPlaceholder = lazy(() => import("./pages/admin/Placeholder.jsx"));
const AdminConfiguracion = lazy(() => import("./pages/admin/Configuracion.jsx"));

const BASENAME = "/frontera/extractos";

function AdminRoute({ children }) {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 60, textAlign: "center", color: T.inkSoft }}>Cargando…</div>
      }
    >
      {children}
    </Suspense>
  );
}

export default function ExtractosApp() {
  return (
    <BrowserRouter basename={BASENAME}>
      <Layout>
        <Routes>
          <Route path="/" element={<Cotizador />} />
          <Route path="/orden/:orderNumber" element={<Confirmacion />} />
          <Route path="/admin/login" element={<AdminRoute><AdminLogin /></AdminRoute>} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPlaceholder
                  title="Dashboard de órdenes"
                  description="Acá aparecerá la lista de órdenes pendientes de difusión, pagadas, certificadas y completadas. Se activa cuando conectemos Supabase con las credenciales del proyecto."
                />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orden/:orderNumber"
            element={
              <AdminRoute>
                <AdminPlaceholder
                  title="Detalle de orden"
                  description="Vista completa con datos del cliente, texto del extracto, acciones (marcar difundido, generar certificado, enviar al cliente) y timeline de eventos. Pendiente de Supabase."
                />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/configuracion"
            element={
              <AdminRoute>
                <AdminConfiguracion />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
