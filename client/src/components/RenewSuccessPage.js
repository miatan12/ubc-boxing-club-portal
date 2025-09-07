import { useEffect, useState } from "react";
import axios from "axios";

export default function RenewSuccessPage() {
  const [msg, setMsg] = useState("Finalizing your renewal…");

  const API_BASE =
    process.env.REACT_APP_API_URL?.replace(/\/+$/, "") ||
    "http://localhost:5050";

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem("renewalData");
        if (!raw) {
          setMsg(
            "No renewal info found. If you completed payment, please contact us."
          );
          return;
        }
        const data = JSON.parse(raw);
        // Basic guard
        if (!data?.email || !data?.newExpiryDate || !data?.paymentAmount) {
          setMsg("Renewal info incomplete. Please contact us.");
          return;
        }

        // Post to backend to actually renew
        await axios.post(`${API_BASE}/api/members/renew`, {
          email: String(data.email).trim().toLowerCase(),
          paymentMethod: "online",
          paymentAmount: data.paymentAmount, // dollars
          newExpiryDate: data.newExpiryDate, // ISO string
        });

        // Cleanup & redirect
        localStorage.removeItem("renewalData");
        sessionStorage.removeItem("renewalReady");
        setMsg("Renewal complete! Redirecting to home…");
        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      } catch (err) {
        console.error("Renew success finalize error:", err);
        setMsg(
          "We received your payment, but couldn’t finalize the renewal. Please contact us."
        );
      }
    })();
  }, []);

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-3">Membership Renewal</h1>
      <p>{msg}</p>
    </div>
  );
}
