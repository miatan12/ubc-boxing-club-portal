import React, { useState } from "react";
import axios from "axios";

const RenewForm = () => {
  const [email, setEmail] = useState("");
  const [membershipType, setMembershipType] = useState("term");
  const [status, setStatus] = useState("idle"); // idle | loading | error

  const handleStripeRenewal = async () => {
    if (!email.trim()) {
      alert("Please enter your email.");
      return;
    }

    setStatus("loading");

    try {
      // Step 1: Check if email exists and is expired
      const verifyRes = await axios.get(
        `http://localhost:5050/api/members/verify?name=${encodeURIComponent(
          email
        )}`
      );

      if (!verifyRes.data.found) {
        setStatus("error");
        alert("Member not found. Please check your email.");
        return;
      }

      if (verifyRes.data.active) {
        setStatus("error");
        alert("Your membership is still active. No need to renew yet!");
        return;
      }

      // Step 2: Prepare renewal
      const paymentAmount = membershipType === "year" ? 10310 : 5155;
      const today = new Date();
      const newExpiry = new Date();
      newExpiry.setMonth(
        today.getMonth() + (membershipType === "year" ? 12 : 4)
      );

      const renewalData = {
        email,
        paymentMethod: "online",
        paymentAmount: paymentAmount / 100,
        newExpiryDate: newExpiry,
      };

      localStorage.setItem("renewalData", JSON.stringify(renewalData));
      sessionStorage.setItem("renewalReady", "true");

      // Step 3: Create Stripe session
      const stripeSession = await axios.post(
        "http://localhost:5050/api/checkout/create-checkout-session",
        {
          amount: paymentAmount,
          label:
            membershipType === "year"
              ? "Renewal – Full Year"
              : "Renewal – 4 Month Term",
        }
      );

      window.location.href = stripeSession.data.url;
    } catch (err) {
      console.error("❌ Renewal error:", err);
      setStatus("error");
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">Renew Membership</h2>

      <label className="block mb-1 font-medium">Email</label>
      <input
        type="email"
        placeholder="Enter your email"
        className="w-full mb-4 p-2 border rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label className="block mb-1 font-medium">Membership Type</label>
      <select
        className="w-full mb-6 p-2 border rounded"
        value={membershipType}
        onChange={(e) => setMembershipType(e.target.value)}
      >
        <option value="term">4-Month Term ($51.55)</option>
        <option value="year">Full Year ($103.10)</option>
      </select>

      <button
        onClick={handleStripeRenewal}
        className="bg-purple-600 text-white w-full py-2 rounded hover:bg-purple-700"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Redirecting..." : "Pay & Renew"}
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
