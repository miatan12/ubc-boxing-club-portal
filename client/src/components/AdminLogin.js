import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5050/api/admin/login", {
        password,
      });
      if (res.data.success) {
        localStorage.setItem("isAdmin", "true");
        navigate("/");
      }
    } catch (err) {
      setError("Incorrect password.");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10 p-4 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">Admin Login</h2>
      <input
        type="password"
        placeholder="Enter admin password"
        className="w-full p-2 mb-3 border rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={handleLogin}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        Login
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default AdminLogin;
