// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const authed = sessionStorage.getItem("isAdmin") === "true";
  return authed ? children : <Navigate to="/login" replace />;
}
