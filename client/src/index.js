import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Toaster } from "react-hot-toast";

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
