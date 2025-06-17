import { useEffect, useState } from "react";
import axios from "axios";

const SuccessPage = () => {
  const [status, setStatus] = useState("loading"); // loading | success | error

  useEffect(() => {
    const submitData = async () => {
      try {
        // 🟦 1. Handle new member registration (boxing-form)
        if (
          sessionStorage.getItem("already-submitted") !== "true" &&
          localStorage.getItem("boxing-form")
        ) {
          const raw = JSON.parse(localStorage.getItem("boxing-form"));

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

          const cleaned = {
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

          await axios.post(
            `${process.env.REACT_APP_API_URL}/api/members`,
            cleaned,
            {
              headers: { "Content-Type": "application/json" },
            }
          );

          sessionStorage.setItem("already-submitted", "true");
          localStorage.removeItem("boxing-form");
          sessionStorage.removeItem("submittedToStripe");

          setStatus("success");
          return;
        }

        // 🟪 2. Handle renewal submission (renewalData)
        if (
          sessionStorage.getItem("renewal-submitted") !== "true" &&
          localStorage.getItem("renewalData")
        ) {
          const renewal = JSON.parse(localStorage.getItem("renewalData"));

          await axios.post(
            `${process.env.REACT_APP_API_URL}/api/members/renew`,
            renewal,
            {
              headers: { "Content-Type": "application/json" },
            }
          );

          sessionStorage.setItem("renewal-submitted", "true");
          localStorage.removeItem("renewalData");
          sessionStorage.removeItem("renewalReady");

          setStatus("success");
          return;
        }

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
