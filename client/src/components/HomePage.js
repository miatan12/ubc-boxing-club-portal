import React from "react";
import { Link, useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    navigate("/");
  };

  return (
    <div className="relative min-h-screen bg-white px-6 py-8">
      {/* 🔒 Top-right Admin Button */}
      <div className="absolute top-4 right-4">
        {isAdmin ? (
          <button
            onClick={handleLogout}
            className="text-sm bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        ) : (
          <Link
            to="/login"
            className="text-sm bg-gray-200 text-gray-800 px-4 py-1 rounded hover:bg-gray-300 transition"
          >
            Admin Login
          </Link>
        )}
      </div>

      {/* 💡 Centered Content */}
      <div className="max-w-xl mx-auto text-center mt-12">
        <h1 className="text-4xl font-bold mb-3">UBC Boxing Club Portal</h1>
        <p className="text-gray-600 mb-8">
          Welcome! Please choose an option below.
        </p>

        <div className="space-y-4">
          <Link
            to="/register"
            className="block bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
          >
            New Member Registration
          </Link>
          <Link
            to="/renew"
            className="block bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Renew Membership
          </Link>

          {isAdmin && (
            <>
              <Link
                to="/verify"
                className="block bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
              >
                Verify Members (Check-In)
              </Link>
              <Link
                to="/dashboard"
                className="block bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
              >
                Admin Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
