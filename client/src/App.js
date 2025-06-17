import { Navigate } from "react-router-dom";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import VerifyPage from "./components/VerifyPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RegisterForm from "./components/RegisterForm";
import SuccessPage from "./components/SuccessPage";
import RenewForm from "./components/RenewForm";
import HomePage from "./components/HomePage";

function App() {
  return (
    <Router>
      <Routes>
        {/* ✅ Public Pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/renew" element={<RenewForm />} />

        {/* ✅ Admin Login */}
        <Route path="/login" element={<AdminLogin />} />

        {/* 🔒 Protected Routes */}
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

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
