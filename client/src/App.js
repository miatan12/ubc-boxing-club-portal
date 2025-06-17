import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterForm from "./components/RegisterForm";
import AdminDashboard from "./components/AdminDashboard";
import VerifyPage from "./components/VerifyPage";
import SuccessPage from "./components/SuccessPage";
import RenewForm from "./components/RenewForm";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RegisterForm />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/renew" element={<RenewForm />} />
      </Routes>
    </Router>
  );
}

export default App;
