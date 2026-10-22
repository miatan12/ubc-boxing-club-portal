import { useEffect, useState } from "react";
import { getJSON, okOrThrow } from "../lib/api";

export default function SuccessPage() {
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [flow, setFlow] = useState(null); // "register" | "renew" | "dropin"
  useEffect(() => {
    let cancelled = false;
    let pollTimer;
    let redirectTimer;
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    const deadline = Date.now() + 60000;

    const checkStatus = async () => {
      try {
        if (!sessionId) throw new Error("Missing checkout session.");
        const res = await getJSON(
          `/api/checkout/session-status?session_id=${encodeURIComponent(sessionId)}`,
        );
        await okOrThrow(res, "Could not confirm payment");
        const data = await res.json();
        if (cancelled) return;
        setFlow(data.flow);
        if (data.fulfilled) {
          // Discard data left by older app versions; never submit it again.
          localStorage.removeItem("boxing-form");
          localStorage.removeItem("renewalData");
          ["already-submitted", "renewal-submitted", "submittedToStripe",
            "renewalReady", "checkoutFlow"].forEach((key) => sessionStorage.removeItem(key));
          setStatus("success");
          redirectTimer = setTimeout(() => (window.location.href = "/"), 1200);
        } else if (Date.now() < deadline) {
          pollTimer = setTimeout(checkStatus, 1500);
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error("Payment confirmation failed:", err);
        if (!cancelled) setStatus("error");
      }
    };
    checkStatus();
    return () => {
      cancelled = true;
      clearTimeout(pollTimer);
      clearTimeout(redirectTimer);
    };
  }, []);

  const heading =
    flow === "renew"
      ? "Renewal Successful!"
      : flow === "register"
        ? "Registration Successful!"
        : flow === "dropin"
          ? "Drop-in Successful!"
          : "Finalizing…";

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0b0d] text-neutral-900 dark:text-white flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-neutral-300 dark:border-neutral-700 border-t-red-600 animate-spin" />
            <h1 className="text-2xl font-extrabold">Finalizing…</h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              Waiting for payment confirmation…
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg
                className="h-7 w-7 text-green-600 dark:text-green-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold">{heading}</h1>
            <p className="mt-3 text-neutral-700 dark:text-neutral-200">
              {flow === "dropin"
                ? "Thanks! Your drop-in payment is confirmed. Check your email for the receipt."
                : "Thank you! Your membership has been processed."}
            </p>

            <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              Redirecting to home…
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg
                className="h-7 w-7 text-red-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-red-600">
              We couldn’t confirm your registration
            </h1>
            <p className="mt-3 text-neutral-700 dark:text-neutral-200">
              Your payment may still be processing. Please refresh this page or email{" "}
              <a
                className="underline underline-offset-4 text-red-600 dark:text-red-400"
                href="mailto:amsboxingubc@gmail.com"
              >
                amsboxingubc@gmail.com
              </a>{" "}
              with your payment confirmation.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
