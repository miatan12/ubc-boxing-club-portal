// src/components/DropIn.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { postJSON, okOrThrow } from "../lib/api";
import { toast } from "react-hot-toast";

const PRICE_LABEL = "$10";

export default function DropIn() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

  const buyOnline = async () => {
    try {
      setLoading(true);
      const t = toast.loading("Opening secure checkout…");

      const res = await postJSON("/api/checkout/create-checkout-session", {
        type: "dropin",
        plan: "dropin",
        label: "Drop-in pass — $10",
        successUrl: `${ORIGIN}/success`,
        cancelUrl: `${ORIGIN}/drop-in`,
      });
      await okOrThrow(res, "Could not create checkout session");
      const data = await res.json();
      toast.dismiss(t);

      if (!data?.url) {
        toast.error("Could not open payment page. Try again.");
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      toast.error("Failed to start checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-[#0a0b0d] text-neutral-900 dark:text-white pb-24">
      <div className="mx-auto max-w-xl px-5 pt-6">
        {/* Back */}
        <button
          onClick={() => navigate("/sign-up")}
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Title */}
        <h1 className="mt-4 text-2xl font-bold">Drop-In Session</h1>

        {/* Price banner */}
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          Single-class drop-ins are $10 per session.
        </p>

        {/* Two options */}
        <div className="mt-5 grid gap-4">
          {/* Online card */}
          <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-5">
            <h2 className="text-base font-semibold">Pay Online</h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
              Pay online early and show your confirmation at the door.
            </p>
            <button
              onClick={buyOnline}
              disabled={loading}
              className={[
                "mt-4 rounded-2xl px-5 py-2.5 text-sm font-semibold transition",
                loading
                  ? "bg-red-400 text-white cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700",
              ].join(" ")}
            >
              {loading ? "Starting…" : `Checkout Here`}
            </button>
          </section>

          {/* Cash/exec card */}
          <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-5">
            <h2 className="text-base font-semibold">Pay Cash</h2>
            <ul className="mt-2 text-sm text-neutral-700 dark:text-neutral-300 list-disc pl-5 space-y-1">
              <li>Arrive 10 minutes early.</li>
              <li>Tell a coach or exec you’re here for a drop-in session</li>
              <li>They’ll take cash and mark you in - no account needed!</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}

/* Local icon */
function ArrowLeft({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
