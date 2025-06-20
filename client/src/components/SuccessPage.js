import { useEffect, useRef, useState } from "react";
import axios from "axios";

const SuccessPage = () => {
  const [status, setStatus] = useState("loading"); // loading | success | error
  const hasRun = useRef(false); // prevent double execution in React 18 StrictMode

  // ✅ Reset flags if user re-enters page from home
  useEffect(() => {
    sessionStorage.removeItem("already-submitted");
    sessionStorage.removeItem("renewal-submitted");
  }, []);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const submitData = async () => {
      try {
        console.log("🔵 SuccessPage loaded");

        const alreadySubmitted = sessionStorage.getItem("already-submitted");
        const boxingForm = localStorage.getItem("boxing-form");
        const renewalData = localStorage.getItem("renewalData");
        const renewalSubmitted = sessionStorage.getItem("renewal-submitted");

        console.log("📦 already-submitted:", alreadySubmitted);
        console.log("📦 boxing-form:", boxingForm ? "exists" : "not found");
        console.log("📦 renewalData:", renewalData ? "exists" : "not found");
        console.log("📦 renewal-submitted:", renewalSubmitted);

        // 🟦 1. New member registration
        if (alreadySubmitted !== "true" && boxingForm) {
          const raw = JSON.parse(boxingForm);
          const {
            name,
            email,
            studentNumber,
            emergencyContactName,
            emergencyContactPhone,
            emergencyContactRelation,
            waiverSigned,
            membershipType,
            startDate,
            expiryDate,
            paymentMethod,
            cashReceiver = "",
          } = raw;

          const payload = {
            name,
            email,
            studentNumber,
            emergencyContactName,
            emergencyContactPhone,
            emergencyContactRelation,
            waiverSigned,
            membershipType,
            startDate,
            expiryDate,
            paymentMethod,
            cashReceiver,
          };

          console.log("🚀 Submitting new member from localStorage...");
          console.log("📮 Payload:", payload);

          // 🛑 Set early to prevent duplicate submit on re-render
          sessionStorage.setItem("already-submitted", "true");

          await axios.post(
            `${process.env.REACT_APP_API_URL}/api/members`,
            payload,
            { headers: { "Content-Type": "application/json" } }
          );

          localStorage.removeItem("boxing-form");
          sessionStorage.removeItem("submittedToStripe");

          console.log("✅ Member successfully submitted");
          setStatus("success");
          return;
        }

        // 🟪 2. Membership renewal
        if (renewalSubmitted !== "true" && renewalData) {
          const renewal = JSON.parse(renewalData);

          console.log("🚀 Submitting renewal data...");
          console.log("📮 Payload:", renewal);

          sessionStorage.setItem("renewal-submitted", "true");

          await axios.post(
            `${process.env.REACT_APP_API_URL}/api/members/renew`,
            renewal,
            { headers: { "Content-Type": "application/json" } }
          );

          localStorage.removeItem("renewalData");
          sessionStorage.removeItem("renewalReady");

          console.log("✅ Renewal successfully submitted");
          setStatus("success");
          return;
        }

        console.warn("⚠️ Nothing to submit. Showing error.");
        setStatus("error");
      } catch (err) {
        console.error("❌ Submission failed after payment:", err);
        sessionStorage.removeItem("already-submitted");
        sessionStorage.removeItem("renewal-submitted");
        setStatus("error");
      }
    };

    submitData();
  }, []);

  return (
    <div className="p-8 max-w-xl mx-auto text-center">
      {status === "loading" && (
        <h1 className="text-2xl font-bold text-gray-700">Finalizing...</h1>
      )}
      {/* Back to home link */}
      <div className="text-left mb-4">
        <a
          href="/"
          className="text-sm text-blue-600 underline hover:text-blue-800"
        >
          ← Back to Home
        </a>
      </div>
      {status === "success" && (
        <>
          <h1 className="text-3xl font-bold text-green-600">
            Payment Successful!
          </h1>
          <p className="mt-4 text-gray-700">
            Thank you! Your membership has been processed.
          </p>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="text-3xl font-bold text-red-600">
            Something went wrong
          </h1>
          <p className="mt-4 text-gray-700">
            Please contact ubcboxing@gmail.com with your payment confirmation.
          </p>
        </>
      )}
    </div>
  );
};

export default SuccessPage;
