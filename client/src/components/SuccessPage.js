import { useEffect, useRef, useState } from "react";
import axios from "axios";

export default function SuccessPage() {
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [flow, setFlow] = useState(null); // "register" | "renew"
  const hasRun = useRef(false);

  // If user re-enters page, reset flags
  useEffect(() => {
    sessionStorage.removeItem("already-submitted");
    sessionStorage.removeItem("renewal-submitted");
  }, []);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    (async () => {
      try {
        const alreadySubmitted = sessionStorage.getItem("already-submitted");
        const renewalSubmitted = sessionStorage.getItem("renewal-submitted");
        const boxingForm = localStorage.getItem("boxing-form");
        const renewalData = localStorage.getItem("renewalData");

        // ---- Registration flow ----
        if (alreadySubmitted !== "true" && boxingForm) {
          setFlow("register");

          const raw = JSON.parse(boxingForm);
          const payload = {
            name: raw.name,
            email: raw.email,
            studentNumber: raw.studentNumber,
            emergencyContactName: raw.emergencyContactName,
            emergencyContactPhone: raw.emergencyContactPhone,
            emergencyContactRelation: raw.emergencyContactRelation,
            waiverSigned: raw.waiverSigned,
            membershipType: raw.membershipType,
            startDate: raw.startDate,
            expiryDate: raw.expiryDate,
            paymentMethod: raw.paymentMethod,
            cashReceiver: raw.cashReceiver || "",
          };

          sessionStorage.setItem("already-submitted", "true");
          await axios.post(
            `${process.env.REACT_APP_API_URL}/api/members`,
            payload,
            { headers: { "Content-Type": "application/json" } }
          );

          localStorage.removeItem("boxing-form");
          sessionStorage.removeItem("submittedToStripe");
          setStatus("success");
          setTimeout(() => (window.location.href = "/"), 1200);
          return;
        }

        // ---- Renewal flow ----
        if (renewalSubmitted !== "true" && renewalData) {
          setFlow("renew");

          const renewal = JSON.parse(renewalData);
          sessionStorage.setItem("renewal-submitted", "true");

          await axios.post(
            `${process.env.REACT_APP_API_URL}/api/members/renew`,
            renewal,
            { headers: { "Content-Type": "application/json" } }
          );

          localStorage.removeItem("renewalData");
          sessionStorage.removeItem("renewalReady");
          setStatus("success");
          setTimeout(() => (window.location.href = "/"), 1200);
          return;
        }

        // Nothing to submit
        setStatus("error");
      } catch (err) {
        console.error("❌ Finalize after payment failed:", err);
        sessionStorage.removeItem("already-submitted");
        sessionStorage.removeItem("renewal-submitted");
        setStatus("error");
      }
    })();
  }, []);

  const heading =
    flow === "renew"
      ? "Renewal Successful!"
      : flow === "register"
      ? "Registration Successful!"
      : "Finalizing…";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-lg text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-gray-300 border-t-green-500 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-800">Finalizing…</h1>
            <p className="mt-2 text-gray-600">Please don’t close this tab.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="h-7 w-7 text-green-600"
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
            <h1 className="text-3xl font-extrabold text-green-600">
              {heading}
            </h1>
            <p className="mt-3 text-gray-700">
              Thank you! Your membership has been processed.
            </p>
            <p className="mt-1 text-sm text-gray-500">Redirecting to home…</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
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
              We couldn’t finalize your payment
            </h1>
            <p className="mt-3 text-gray-700">
              Please email{" "}
              <span className="font-medium">ubcboxing@gmail.com</span> with your
              payment confirmation.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
