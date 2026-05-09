import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { T } from "../../theme.js";
import { useAuth } from "../../lib/auth.jsx";

export default function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: T.inkSoft }}>
        Verificando sesión…
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children;
}
