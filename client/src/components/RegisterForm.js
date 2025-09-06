import React, { useState } from "react";
import axios from "axios";

const PRICES = {
  // (labels only; server enforces price from plan)
  online: {
    term: { label: "Student — 1 Term (4 months) — $51.55 online" },
    year: { label: "Student — 3 Terms (12 months) — $103.10 online" },
    nonstudent: { label: "Non-Student — 12 months — $82.50 online" },
  },
  cash: {
    term: { label: "Student — 1 Term (4 months) — $50 cash" },
    year: { label: "Student — 3 Terms (12 months) — $100 cash" },
    nonstudent: { label: "Non-Student — 12 months — $80 cash" },
  },
};

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    studentNumber: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    waiverSigned: false,
    paymentMethod: "", // "online" | "cash"
    membershipType: "", // "term" | "year" | "nonstudent"
    startDate: "",
    expiryDate: "",
    cashReceiver: "",
  });
  const [status, setStatus] = useState(""); // "", "success", "error"

  const API_BASE =
    process.env.REACT_APP_API_URL?.replace(/\/+$/, "") ||
    "http://localhost:5050";
  const ORIGIN = window.location.origin;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      if (name === "paymentMethod") {
        return {
          ...prev,
          paymentMethod: value,
          membershipType: "",
          cashReceiver: "",
        };
      }
      return { ...prev, [name]: type === "checkbox" ? checked : value };
    });
  };

  const calculateExpiry = (membershipType) => {
    const start = new Date();
    const expiry = new Date(start);
    if (membershipType === "term") expiry.setMonth(start.getMonth() + 4);
    if (membershipType === "year") expiry.setMonth(start.getMonth() + 12);
    if (membershipType === "nonstudent") expiry.setMonth(start.getMonth() + 12);
    return { startDate: start.toISOString(), expiryDate: expiry.toISOString() };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.waiverSigned)
      return alert("Please agree to the waiver form.");
    if (!formData.paymentMethod) return alert("Please choose a payment type.");
    if (!formData.membershipType) return alert("Please choose a membership.");
    if (formData.paymentMethod === "cash" && !formData.cashReceiver.trim()) {
      setStatus("error");
      return alert("Please enter the exec name for cash payments.");
    }

    const { startDate, expiryDate } = calculateExpiry(formData.membershipType);
    const emailNorm = formData.email.trim().toLowerCase();

    if (formData.paymentMethod === "online") {
      // Persist payload for /success page to POST /api/members
      const payload = { ...formData, email: emailNorm, startDate, expiryDate };
      localStorage.setItem("boxing-form", JSON.stringify(payload));

      const pricing = PRICES.online[formData.membershipType];
      try {
        const { data } = await axios.post(
          `${API_BASE}/api/checkout/create-checkout-session`,
          {
            plan: formData.membershipType, // << send plan (server enforces price)
            label: pricing.label,
            type: "register",
            successUrl: `${ORIGIN}/success`,
            cancelUrl: `${ORIGIN}/register`,
          }
        );
        if (!data?.url) return alert("Server error creating payment session.");
        sessionStorage.setItem("submittedToStripe", "true");
        window.location.href = data.url;
      } catch (err) {
        console.error("Stripe redirect error:", err);
        setStatus("error");
        alert("Failed to redirect to payment page.");
      }
      return;
    }

    // Cash path (server computes price from membershipType + paymentMethod)
    try {
      const fd = new FormData();
      Object.entries({
        ...formData,
        email: emailNorm,
        startDate,
        expiryDate,
      }).forEach(([k, v]) => fd.append(k, v));
      await axios.post(`${API_BASE}/api/members`, fd);
      setStatus("success");
      setTimeout(() => {
        window.location.href = "/";
      }, 1800);
    } catch (err) {
      console.error("Cash submission failed:", err);
      setStatus("error");
      alert("Submission failed. Please try again.");
    }
  };

  const paymentChosen = !!formData.paymentMethod;
  const options = paymentChosen ? PRICES[formData.paymentMethod] : null;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 p-6 max-w-xl mx-auto bg-white shadow rounded"
    >
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
          UBC Boxing Club Registration
        </h2>
      </div>

      {/* Personal Info */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Personal Info</h3>
        <input
          name="name"
          placeholder="Full Name"
          onChange={handleChange}
          className="border p-2 w-full mb-2"
          required
        />
        <input
          name="studentNumber"
          placeholder="Student Number"
          onChange={handleChange}
          className="border p-2 w-full mb-2"
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />
      </div>

      {/* Emergency Contact */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Emergency Contact</h3>
        <input
          name="emergencyContactName"
          placeholder="Contact Name"
          onChange={handleChange}
          className="border p-2 w-full mb-2"
          required
        />
        <input
          name="emergencyContactRelation"
          placeholder="Relation to Member"
          onChange={handleChange}
          className="border p-2 w-full mb-2"
          required
        />
        <input
          name="emergencyContactPhone"
          placeholder="Contact Phone"
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />
      </div>

      {/* Waiver */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Waiver</h3>
        <label className="block">
          <input
            type="checkbox"
            name="waiverSigned"
            onChange={handleChange}
            className="mr-2"
            required
          />
          I have read and agreed to the{" "}
          <a
            href="https://drive.google.com/file/d/1QsYcL9lLM6DOuoZ5VjC5avfe4BSqhTr7/view"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            waiver form
          </a>
        </label>
      </div>

      {/* Payment-first UX */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Membership & Payment</h3>

        <label className="block mb-2 font-medium">Payment Type</label>
        <select
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleChange}
          className="border p-2 w-full mb-4"
          required
        >
          <option value="">Choose payment type…</option>
          <option value="online">Online (Stripe)</option>
          <option value="cash">Cash (paid in-person)</option>
        </select>

        <label className="block mb-2 font-medium">Membership</label>
        <select
          name="membershipType"
          value={formData.membershipType}
          onChange={handleChange}
          className="border p-2 w-full mb-4"
          disabled={!paymentChosen}
          required
        >
          {/* Always show a placeholder that doesn’t count as a selection */}
          <option value="">
            {paymentChosen ? "Choose membership…" : "Select payment type first"}
          </option>

          {paymentChosen && (
            <>
              <option value="term">{options.term.label}</option>
              <option value="year">{options.year.label}</option>
              <option value="nonstudent">{options.nonstudent.label}</option>
            </>
          )}
        </select>

        {formData.paymentMethod === "online" && (
          <div className="text-sm text-gray-700 bg-gray-100 mt-3 p-3 rounded">
            <p>
              You’ll be redirected to a secure Stripe checkout page after
              submission.
            </p>
          </div>
        )}

        {formData.paymentMethod === "cash" && (
          <div className="mt-3 space-y-2">
            <label className="block font-medium">
              Name of exec who received your cash payment:
            </label>
            <input
              name="cashReceiver"
              placeholder="Exec's full name"
              onChange={handleChange}
              className="border p-2 w-full"
              required
            />
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="text-center">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          Submit
        </button>
        {status === "success" && (
          <p className="text-green-600 font-semibold mt-2">
            Successfully submitted! Redirecting…
          </p>
        )}
        {status === "error" && (
          <p className="text-red-600 font-semibold mt-2">
            Submission failed. Please try again.
          </p>
        )}
      </div>
    </form>
  );
};

export default RegisterForm;
