// src/components/RenewForm.jsx
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { getJSON, postJSON, okOrThrow } from "../lib/api";

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

function ArrowLeft({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export default function RenewForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(""); // "online" | "cash"
  const [membershipType, setMembershipType] = useState(""); // "term" | "year" | "nonstudent"
  const [cashReceiver, setCashReceiver] = useState("");
  const [status, setStatus] = useState("idle"); // "idle" | "loading"

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
    if (!fieldsValid) return;

    setStatus("loading");
    const loadingId = toast.loading("Checking your membership…");

    try {
      // 1) Verify member & status
      const resVerify = await getJSON(
        `/api/members/verify?email=${encodeURIComponent(emailNorm)}`
      );
      await okOrThrow(resVerify, "Verify failed");
      const verify = await resVerify.json();

      if (!verify?.found) {
        toast.dismiss(loadingId);
        setStatus("idle");
        return toast.error("Member not found. Please check your email.");
      }
      if (verify?.active) {
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
        const resRenew = await postJSON("/api/members/renew", {
          email: emailNorm,
          paymentMethod: "cash",
          paymentAmount: CASH_DOLLARS[membershipType],
          newExpiryDate: newExpiry.toISOString(),
          cashReceiver: cashReceiver.trim(),
        });
        await okOrThrow(resRenew, "Failed to record renewal");
        await resRenew.json(); // optional, ensure parse

        toast.success("Renewal recorded!", { id: loadingId });
        setStatus("idle");
        setTimeout(() => navigate("/", { replace: true }), 1200);
        return;
      }

      // 4) Online path: stash details and go to Stripe
      toast.loading("Redirecting to secure checkout…", { id: loadingId });

      const renewalData = {
        email: emailNorm,
        paymentMethod: "online",
        paymentAmount: ONLINE_DOLLARS[membershipType], // dollars (for your /success usage)
        newExpiryDate: newExpiry.toISOString(),
      };
      localStorage.setItem("renewalData", JSON.stringify(renewalData));
      sessionStorage.setItem("renewalReady", "true");

      const resStripe = await postJSON(
        "/api/checkout/create-checkout-session",
        {
          plan: membershipType, // server enforces pricing
          label: LABELS.online[membershipType],
          type: "renew",
          successUrl: `${ORIGIN}/success`,
          cancelUrl: `${ORIGIN}/renew`,
        }
      );
      await okOrThrow(resStripe, "Payment session not created");
      const data = await resStripe.json();

      if (!data?.url) throw new Error("Payment session not created.");
      toast.dismiss(loadingId);
      window.location.href = data.url;
    } catch (err) {
      console.error("❌ Renewal error:", err);
      toast.dismiss();
      setStatus("idle");
      toast.error(err?.message || "Something went wrong. Please try again.");
    }
  };

  const options = paymentMethod ? LABELS[paymentMethod] : null;
  const isSubmitting = status === "loading";
  const disableBtn = isSubmitting || !fieldsValid;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0b0d] text-neutral-900 dark:text-white pb-24">
      <div className="mx-auto max-w-md px-5 pt-6">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <h2 className="mt-4 text-3xl font-extrabold tracking-tight">
          Renew Membership
        </h2>

        <div className="mt-5 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <label className="block mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Email
          </label>
          <input
            type="email"
            required
            placeholder="you@example.com"
            className="w-full mb-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="block mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Payment Type
          </label>
          <select
            className="w-full mb-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
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

          <label className="block mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Renewal Option
          </label>
          <select
            className="w-full mb-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-60"
            value={membershipType}
            onChange={(e) => setMembershipType(e.target.value)}
            disabled={!paymentMethod}
            required
          >
            <option value="">
              {paymentMethod
                ? "Choose membership…"
                : "Select payment type first"}
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
              <label className="block mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Name of exec who received your cash
              </label>
              <input
                type="text"
                placeholder="Exec's full name"
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                value={cashReceiver}
                onChange={(e) => setCashReceiver(e.target.value)}
                required
              />
            </div>
          )}

          {paymentMethod === "online" && (
            <div className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800/60 mt-3 p-3 rounded-xl">
              You’ll be redirected to a secure Stripe checkout page after
              clicking
              <span className="font-semibold"> “Pay & Renew”</span>.
            </div>
          )}

          <button
            onClick={handleRenew}
            className={[
              "mt-5 w-full rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
              disableBtn
                ? "bg-red-400 text-white cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700",
            ].join(" ")}
            disabled={disableBtn}
            aria-disabled={disableBtn}
            title={
              !fieldsValid ? "Complete all required fields to continue" : ""
            }
          >
            {isSubmitting
              ? "Redirecting…"
              : paymentMethod === "cash"
              ? "Record Cash Renewal"
              : "Pay & Renew"}
          </button>
        </div>
      </div>
    </div>
  );
}
