import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

export default function RequireSocio({ children, adminOnly = false }) {
  const { loading, isSocio, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#F6F3EE]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#B91C1C]/20 border-t-[#B91C1C] animate-spin" />
          <p className="text-sm text-[#9C8E85] tracking-wide">Verificando sesión…</p>
        </div>
      </div>
    );
  }

  if (!isSocio) return <Navigate to="/socios-rds/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/socios-rds" replace />;

  return children;
}
