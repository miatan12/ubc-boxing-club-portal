import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterForm from "./components/RegisterForm";
import AdminDashboard from "./components/AdminDashboard"; // ← Add this once you create the file
import VerifyPage from "./components/VerifyPage";
import SuccessPage from "./components/SuccessPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RegisterForm />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/success" element={<SuccessPage />} />
      </Routes>
    </Router>
  );
}

export default App;
