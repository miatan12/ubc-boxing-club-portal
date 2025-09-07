// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppShell from "./components/AppShell";
import HomePage from "./components/HomePage";
import RegisterForm from "./components/RegisterForm";
import RenewForm from "./components/RenewForm";
import SuccessPage from "./components/SuccessPage";

import AdminLogin from "./components/AdminLogin";
import AdminPage from "./components/AdminPage"; // <-- NEW
import AdminDashboard from "./components/AdminDashboard";
import VerifyPage from "./components/VerifyPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Everything inside the shell gets the bottom tabs + theme toggle */}
        <Route element={<AppShell />}>
          {/* Public */}
          <Route index element={<HomePage />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/renew" element={<RenewForm />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/login" element={<AdminLogin />} />

          {/* Admin (protected) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verify"
            element={
              <ProtectedRoute>
                <VerifyPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
