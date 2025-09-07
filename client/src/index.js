// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Toaster } from "react-hot-toast";

// --- Apply theme ASAP (default: dark) ---
const savedTheme = localStorage.getItem("theme"); // 'dark' | 'light' | null
const isDark = savedTheme ? savedTheme === "dark" : true; // default to dark
document.documentElement.classList.toggle("dark", isDark);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <>
      <App />
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{ duration: 4000 }}
      />
    </>
  </React.StrictMode>
);

reportWebVitals();
