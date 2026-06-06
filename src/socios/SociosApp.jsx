import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/auth.jsx";
import RequireSocio from "./components/RequireSocio.jsx";

const Login = lazy(() => import("./pages/Login.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Admin = lazy(() => import("./pages/Admin.jsx"));

function Loader() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#F6F3EE]">
      <div className="w-8 h-8 rounded-full border-2 border-[#B91C1C]/20 border-t-[#B91C1C] animate-spin" />
    </div>
  );
}

export default function SociosApp() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/socios/login" element={<Login />} />
            <Route
              path="/socios"
              element={
                <RequireSocio>
                  <Dashboard />
                </RequireSocio>
              }
            />
            <Route
              path="/socios/admin"
              element={
                <RequireSocio adminOnly>
                  <Admin />
                </RequireSocio>
              }
            />
            <Route path="*" element={<Navigate to="/socios/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
