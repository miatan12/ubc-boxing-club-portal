import React, { useState } from "react";
import axios from "axios";

// Server enforces Stripe price; we only need dollars for our own /renew payload
const ONLINE_DOLLARS = { term: 51.55, year: 103.1, nonstudent: 82.5 };
const CASH_DOLLARS = { term: 50, year: 100, nonstudent: 80 };

const LABELS = {
  online: {
    term: "Renewal — Student — 1 Term (4 months) — $51.55",
    year: "Renewal — Student — 3 Terms (12 months) — $103.10",
    nonstudent: "Renewal — Non-Student — 12 months — $82.50",
  },
  cash: {
    term: "Renewal — Student — 1 Term (4 months) — $50",
    year: "Renewal — Student — 3 Terms (12 months) — $100",
    nonstudent: "Renewal — Non-Student — 12 months — $80",
  },
};

const RenewForm = () => {
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(""); // "online" | "cash"
  const [membershipType, setMembershipType] = useState(""); // "term" | "year" | "nonstudent"
  const [status, setStatus] = useState("idle"); // idle | loading | error

  const API_BASE =
    process.env.REACT_APP_API_URL?.replace(/\/+$/, "") ||
    "http://localhost:5050";
  const ORIGIN = window.location.origin;

  const handleStripeRenewal = async () => {
    const emailNorm = email.trim().toLowerCase();
    if (!emailNorm) return alert("Please enter your email.");
    if (!paymentMethod) return alert("Please choose a payment type.");
    if (!membershipType) return alert("Please choose a membership option.");

    setStatus("loading");
    try {
      // Verify
      const verify = await axios.get(
        `${API_BASE}/api/members/verify?name=${encodeURIComponent(emailNorm)}`
      );
      if (!verify.data?.found) {
        setStatus("error");
        return alert("Member not found.");
      }
      if (verify.data?.active) {
        setStatus("error");
        return alert("Your membership is still active. No need to renew yet.");
      }

      // Compute new expiry
      const months = membershipType === "term" ? 4 : 12;
      const now = new Date();
      const newExpiry = new Date(now);
      newExpiry.setMonth(now.getMonth() + months);

      if (paymentMethod === "cash") {
        // Direct server update
        await axios.post(`${API_BASE}/api/members/renew`, {
          email: emailNorm,
          paymentMethod: "cash",
          paymentAmount: CASH_DOLLARS[membershipType],
          newExpiryDate: newExpiry.toISOString(),
        });
        setStatus("idle");
        alert("Renewal recorded! Redirecting to home…");
        window.location.href = "/";
        return;
      }

      // Online (Stripe): server enforces price by plan
      const renewalData = {
        email: emailNorm,
        paymentMethod: "online",
        paymentAmount: ONLINE_DOLLARS[membershipType], // dollars for our /renew call after success
        newExpiryDate: newExpiry.toISOString(),
      };
      localStorage.setItem("renewalData", JSON.stringify(renewalData));
      sessionStorage.setItem("renewalReady", "true");

      const { data } = await axios.post(
        `${API_BASE}/api/checkout/create-checkout-session`,
        {
          plan: membershipType, // << send plan, not amount
          label: LABELS.online[membershipType],
          type: "renew",
          successUrl: `${ORIGIN}/renew-success`,
          cancelUrl: `${ORIGIN}/renew`,
        }
      );
      if (!data?.url) throw new Error("Payment session not created.");
      window.location.href = data.url;
    } catch (err) {
      console.error("❌ Renewal error:", err);
      setStatus("error");
      alert(
        err?.response?.data?.error || err.message || "Something went wrong."
      );
    }
  };

  const options = paymentMethod ? LABELS[paymentMethod] : null;

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="mb-4">
        <div className="text-left">
          <a
            href="/"
            className="text-sm text-blue-600 underline hover:text-blue-800"
          >
            ← Back to Home
          </a>
        </div>
        <h2 className="text-2xl font-bold text-center mt-2">
          Renew Membership
        </h2>
      </div>

      <label className="block mb-1 font-medium">Email</label>
      <input
        type="email"
        placeholder="Enter your email"
        className="w-full mb-4 p-2 border rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label className="block mb-1 font-medium">Payment Type</label>
      <select
        className="w-full mb-4 p-2 border rounded"
        value={paymentMethod}
        onChange={(e) => {
          setPaymentMethod(e.target.value);
          setMembershipType("");
        }}
      >
        <option value="">Choose payment type…</option>
        <option value="online">Online (Stripe)</option>
        <option value="cash">Cash (paid in-person)</option>
      </select>

      <label className="block mb-1 font-medium">Renewal Option</label>
      <select
        className="w-full mb-6 p-2 border rounded"
        value={membershipType}
        onChange={(e) => setMembershipType(e.target.value)}
        disabled={!paymentMethod}
        required
      >
        <option value="">
          {paymentMethod ? "Choose membership…" : "Select payment type first"}
        </option>

        {paymentMethod && (
          <>
            <option value="term">{options.term}</option>
            <option value="year">{options.year}</option>
            <option value="nonstudent">{options.nonstudent}</option>
          </>
        )}
      </select>

      {paymentMethod === "online" && (
        <div className="text-sm text-gray-700 bg-gray-100 mt-3 p-3 rounded">
          <p>
            You’ll be redirected to a secure Stripe checkout page after clicking
            “Pay & Renew”.
          </p>
        </div>
      )}

      <button
        onClick={handleStripeRenewal}
        className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 mt-4"
        disabled={status === "loading"}
      >
        {status === "loading"
          ? "Redirecting..."
          : paymentMethod === "cash"
          ? "Record Cash Renewal"
          : "Pay & Renew"}
      </button>

      {status === "error" && (
        <p className="text-red-600 mt-4 text-sm">
          Something went wrong. Please try again or contact us.
        </p>
      )}
    </div>
  );
};

export default RenewForm;
