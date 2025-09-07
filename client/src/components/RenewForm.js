import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const ONLINE_DOLLARS = { term: 51.55, year: 103.1, nonstudent: 82.5 };
const CASH_DOLLARS = { term: 50, year: 100, nonstudent: 80 };

const LABELS = {
  online: {
    term: "Renewal — Student — 1 Term (4 months) — $51.55",
    year: "Renewal — Student — 3 Terms (12 months) — $103.10",
    nonstudent: "Renewal — Non-Student — 4 months — $82.50",
  },
  cash: {
    term: "Renewal — Student — 1 Term (4 months) — $50",
    year: "Renewal — Student — 3 Terms (12 months) — $100",
    nonstudent: "Renewal — Non-Student — 4 months — $80",
  },
};

export default function RenewForm() {
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(""); // "online" | "cash"
  const [membershipType, setMembershipType] = useState(""); // "term" | "year" | "nonstudent"
  const [cashReceiver, setCashReceiver] = useState("");
  const [status, setStatus] = useState("idle"); // "idle" | "loading"

  const API_BASE =
    process.env.REACT_APP_API_URL?.replace(/\/+$/, "") ||
    "http://localhost:5050";
  const ORIGIN = window.location.origin;

  // ----- simple form validity -----
  const emailNorm = email.trim().toLowerCase();
  const emailValid = /\S+@\S+\.\S+/.test(emailNorm);
  const needsExec = paymentMethod === "cash";
  const fieldsValid =
    emailValid &&
    !!paymentMethod &&
    !!membershipType &&
    (!needsExec || cashReceiver.trim().length > 0);

  const handleRenew = async () => {
    if (!fieldsValid) return; // extra guard

    setStatus("loading");
    const loadingId = toast.loading("Checking your membership…");

    try {
      // 1) Verify member & status
      const verify = await axios.get(
        `${API_BASE}/api/members/verify?name=${encodeURIComponent(emailNorm)}`
      );
      if (!verify.data?.found) {
        toast.dismiss(loadingId);
        setStatus("idle");
        return toast.error("Member not found. Please check your email.");
      }
      if (verify.data?.active) {
        toast.dismiss(loadingId);
        setStatus("idle");
        return toast("Your membership is still active.", { icon: "ℹ️" });
      }

      // 2) Compute new expiry (term = 4, nonstudent = 4, year = 12)
      const months = membershipType === "year" ? 12 : 4;
      const now = new Date();
      const newExpiry = new Date(now);
      newExpiry.setMonth(now.getMonth() + months);

      // 3) Cash path: record immediately
      if (paymentMethod === "cash") {
        toast.loading("Recording your renewal…", { id: loadingId });
        await axios.post(`${API_BASE}/api/members/renew`, {
          email: emailNorm,
          paymentMethod: "cash",
          paymentAmount: CASH_DOLLARS[membershipType],
          newExpiryDate: newExpiry.toISOString(),
          cashReceiver: cashReceiver.trim(), // if your backend stores this
        });
        toast.success("Renewal recorded!", { id: loadingId });
        setStatus("idle");
        setTimeout(() => (window.location.href = "/"), 1200);
        return;
      }

      // 4) Online path: stash details and go to Stripe
      toast.loading("Redirecting to secure checkout…", { id: loadingId });

      const renewalData = {
        email: emailNorm,
        paymentMethod: "online",
        paymentAmount: ONLINE_DOLLARS[membershipType], // dollars
        newExpiryDate: newExpiry.toISOString(),
      };
      localStorage.setItem("renewalData", JSON.stringify(renewalData));
      sessionStorage.setItem("renewalReady", "true");

      const { data } = await axios.post(
        `${API_BASE}/api/checkout/create-checkout-session`,
        {
          plan: membershipType, // server enforces pricing
          label: LABELS.online[membershipType],
          type: "renew",
          successUrl: `${ORIGIN}/success`,
          cancelUrl: `${ORIGIN}/renew`,
        }
      );
      if (!data?.url) throw new Error("Payment session not created.");
      toast.dismiss(loadingId);
      window.location.href = data.url;
    } catch (err) {
      console.error("❌ Renewal error:", err);
      toast.dismiss();
      setStatus("idle");
      toast.error(
        err?.response?.data?.error || err.message || "Something went wrong."
      );
    }
  };

  const options = paymentMethod ? LABELS[paymentMethod] : null;
  const isSubmitting = status === "loading";
  const disableBtn = isSubmitting || !fieldsValid;

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
        required
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
          setCashReceiver("");
        }}
        required
      >
        <option value="">Choose payment type…</option>
        <option value="online">Online (Stripe)</option>
        <option value="cash">Cash (paid in-person)</option>
      </select>

      <label className="block mb-1 font-medium">Renewal Option</label>
      <select
        className="w-full mb-4 p-2 border rounded"
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
            <option value="term">{options?.term}</option>
            <option value="year">{options?.year}</option>
            <option value="nonstudent">{options?.nonstudent}</option>
          </>
        )}
      </select>

      {paymentMethod === "cash" && (
        <div className="mt-3">
          <label className="block mb-1 font-medium">
            Name of exec who received your cash:
          </label>
          <input
            type="text"
            placeholder="Exec's full name"
            className="w-full p-2 border rounded"
            value={cashReceiver}
            onChange={(e) => setCashReceiver(e.target.value)}
            required
          />
        </div>
      )}

      {paymentMethod === "online" && (
        <div className="text-sm text-gray-700 bg-gray-100 mt-3 p-3 rounded">
          You’ll be redirected to a secure Stripe checkout page after clicking
          “Pay & Renew”.
        </div>
      )}

      <button
        onClick={handleRenew}
        className={`bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 mt-4 ${
          disableBtn ? "opacity-50 cursor-not-allowed hover:bg-blue-600" : ""
        }`}
        disabled={disableBtn}
        aria-disabled={disableBtn}
        title={!fieldsValid ? "Complete all required fields to continue" : ""}
      >
        {isSubmitting
          ? "Redirecting…"
          : paymentMethod === "cash"
          ? "Record Cash Renewal"
          : "Pay & Renew"}
      </button>
    </div>
  );
}
