import { useEffect } from "react";
import axios from "axios";

const SuccessPage = () => {
  useEffect(() => {
    const submitData = async () => {
      if (sessionStorage.getItem("already-submitted") === "true") return;

      const stored = localStorage.getItem("boxing-form");
      if (!stored) return;

      const form = JSON.parse(stored);

      try {
        // ✅ Set the flag immediately to prevent re-submission
        sessionStorage.setItem("already-submitted", "true");

        await axios.post(`${process.env.REACT_APP_API_URL}/api/members`, form, {
          headers: { "Content-Type": "application/json" },
        });

        localStorage.removeItem("boxing-form");
        sessionStorage.removeItem("submittedToStripe");
      } catch (err) {
        console.error("❌ Failed to submit member after payment:", err);
        sessionStorage.removeItem("already-submitted"); // rollback flag if error
      }
    };

    submitData();
  }, []);

  return (
    <div className="p-8 max-w-xl mx-auto text-center">
      <h1 className="text-3xl font-bold text-green-600">Payment Successful!</h1>
      <p className="mt-4 text-gray-700">
        Thank you for registering for the UBC Boxing Club. We’ve received your
        payment and your membership has been activated.
      </p>
    </div>
  );
};

export default SuccessPage;
