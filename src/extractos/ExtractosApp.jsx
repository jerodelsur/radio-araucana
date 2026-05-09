import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Cotizador from "./pages/Cotizador.jsx";
import Confirmacion from "./pages/Confirmacion.jsx";
import { AuthProvider } from "./lib/auth.jsx";
import { T } from "./theme.js";

// Admin se lazy-loadea: el bundle del admin no se entrega a los visitantes
// del cotizador público.
const AdminLogin = lazy(() => import("./pages/admin/Login.jsx"));
const AdminForgotPassword = lazy(() => import("./pages/admin/ForgotPassword.jsx"));
const AdminResetPassword = lazy(() => import("./pages/admin/ResetPassword.jsx"));
const RequireAdmin = lazy(() => import("./pages/admin/RequireAdmin.jsx"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard.jsx"));
const AdminOrderDetail = lazy(() => import("./pages/admin/OrderDetail.jsx"));
const AdminConfiguracion = lazy(() => import("./pages/admin/Configuracion.jsx"));

const BASENAME = "/frontera/extractos";

function AdminFallback() {
  return (
    <div style={{ padding: 60, textAlign: "center", color: T.inkSoft }}>Cargando…</div>
  );
}

export default function ExtractosApp() {
  return (
    <AuthProvider>
      <BrowserRouter basename={BASENAME}>
        <Layout>
          <Suspense fallback={<AdminFallback />}>
            <Routes>
              <Route path="/" element={<Cotizador />} />
              <Route path="/orden/:orderNumber" element={<Confirmacion />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
              <Route path="/admin/reset-password" element={<AdminResetPassword />} />
              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <AdminDashboard />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/orden/:orderNumber"
                element={
                  <RequireAdmin>
                    <AdminOrderDetail />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/configuracion"
                element={
                  <RequireAdmin>
                    <AdminConfiguracion />
                  </RequireAdmin>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
