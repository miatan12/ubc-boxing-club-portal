// src/components/RegisterForm.js
import React, { useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const PRICES = {
  // Labels only; server enforces pricing from `plan`
  online: {
    term: { label: "Student — 1 Term (4 months) — $51.55 online" },
    year: { label: "Student — 3 Terms (12 months) — $103.10 online" },
    nonstudent: { label: "Non-Student — 4 months — $82.50 online" },
  },
  cash: {
    term: { label: "Student — 1 Term (4 months) — $50 cash" },
    year: { label: "Student — 3 Terms (12 months) — $100 cash" },
    nonstudent: { label: "Non-Student — 4 months — $80 cash" },
  },
};

const ErrorText = ({ children }) => (
  <p className="text-sm text-red-600 mt-1">{children}</p>
);

export default function RegisterForm() {
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
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(""); // "", "success", "error", "loading"

  const API_BASE =
    process.env.REACT_APP_API_URL?.replace(/\/+$/, "") ||
    "http://localhost:5050";
  const ORIGIN = window.location.origin;

  const paymentChosen = !!formData.paymentMethod;
  const membershipOptions = paymentChosen
    ? PRICES[formData.paymentMethod]
    : null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      // When switching payment method, clear dependent fields
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

    // Clear error for that field as user edits
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const calculateExpiry = (membershipType) => {
    const start = new Date();
    const expiry = new Date(start);
    if (membershipType === "term") expiry.setMonth(start.getMonth() + 4);
    if (membershipType === "year") expiry.setMonth(start.getMonth() + 12);
    if (membershipType === "nonstudent") expiry.setMonth(start.getMonth() + 4); // ← non-student is 4 months
    return { startDate: start.toISOString(), expiryDate: expiry.toISOString() };
  };

  const validate = () => {
    const e = {};
    const email = formData.email.trim().toLowerCase();

    if (!formData.name.trim()) e.name = "Please enter your full name.";
    if (!formData.studentNumber.trim())
      e.studentNumber = "Student number is required.";
    if (!email) e.email = "Please enter your email.";
    if (!formData.emergencyContactName.trim())
      e.emergencyContactName = "Contact name is required.";
    if (!formData.emergencyContactRelation.trim())
      e.emergencyContactRelation = "Relation is required.";
    if (!formData.emergencyContactPhone.trim())
      e.emergencyContactPhone = "Contact phone is required.";
    if (!formData.waiverSigned) e.waiverSigned = "Please agree to the waiver.";
    if (!formData.paymentMethod) e.paymentMethod = "Choose a payment type.";
    if (!formData.membershipType) e.membershipType = "Choose a membership.";
    if (formData.paymentMethod === "cash" && !formData.cashReceiver.trim()) {
      e.cashReceiver = "Enter the exec's full name.";
    }

    setErrors(e);
    return e;
  };

  const canSubmit = useMemo(() => {
    // Simple gate for the button; final check happens in validate()
    return (
      formData.name &&
      formData.email &&
      formData.studentNumber &&
      formData.emergencyContactName &&
      formData.emergencyContactRelation &&
      formData.emergencyContactPhone &&
      formData.waiverSigned &&
      formData.paymentMethod &&
      formData.membershipType &&
      (formData.paymentMethod !== "cash" || formData.cashReceiver.trim())
    );
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const eMap = validate();
    if (Object.keys(eMap).length) {
      // Toast the first error; show others inline
      const first = Object.values(eMap)[0];
      toast.error(String(first));
      return;
    }

    const { startDate, expiryDate } = calculateExpiry(formData.membershipType);
    const emailNorm = formData.email.trim().toLowerCase();

    if (formData.paymentMethod === "online") {
      // Save payload for /success page to POST /api/members
      const payload = { ...formData, email: emailNorm, startDate, expiryDate };
      localStorage.setItem("boxing-form", JSON.stringify(payload));

      const pricing = PRICES.online[formData.membershipType];
      try {
        setStatus("loading");
        const t = toast.loading("Redirecting to secure checkout…");
        const { data } = await axios.post(
          `${API_BASE}/api/checkout/create-checkout-session`,
          {
            plan: formData.membershipType, // server enforces price
            label: pricing.label,
            type: "register",
            successUrl: `${ORIGIN}/success`,
            cancelUrl: `${ORIGIN}/register`,
          }
        );
        toast.dismiss(t);
        if (!data?.url) {
          toast.error("Could not create payment session. Try again.");
          setStatus("error");
          return;
        }
        sessionStorage.setItem("submittedToStripe", "true");
        window.location.href = data.url;
      } catch (err) {
        console.error("Stripe redirect error:", err);
        setStatus("error");
        toast.error("Failed to open payment page. Please try again.");
      }
      return;
    }

    // Cash flow — send directly to API
    try {
      setStatus("loading");
      const fd = new FormData();
      Object.entries({
        ...formData,
        email: emailNorm,
        startDate,
        expiryDate,
      }).forEach(([k, v]) => fd.append(k, v));

      await axios.post(`${API_BASE}/api/members`, fd);
      toast.success("Registered! Redirecting to home…");
      setStatus("success");
      setTimeout(() => (window.location.href = "/"), 1400);
    } catch (err) {
      console.error("Cash submission failed:", err);
      setStatus("error");
      toast.error("Submission failed. Please try again.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 p-6 max-w-xl mx-auto bg-white shadow rounded"
      noValidate
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

        <label className="block mb-1 font-medium">Full Name</label>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="border p-2 w-full"
          placeholder="Jane Doe"
        />
        {errors.name && <ErrorText>{errors.name}</ErrorText>}

        <label className="block mt-4 mb-1 font-medium">Student Number</label>
        <input
          name="studentNumber"
          value={formData.studentNumber}
          onChange={handleChange}
          className="border p-2 w-full"
          placeholder="12345678"
        />
        {errors.studentNumber && <ErrorText>{errors.studentNumber}</ErrorText>}

        <label className="block mt-4 mb-1 font-medium">Email</label>
        <input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className="border p-2 w-full"
          placeholder="you@example.com"
        />
        {errors.email && <ErrorText>{errors.email}</ErrorText>}
      </div>

      {/* Emergency Contact */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Emergency Contact</h3>

        <label className="block mb-1 font-medium">Contact Name</label>
        <input
          name="emergencyContactName"
          value={formData.emergencyContactName}
          onChange={handleChange}
          className="border p-2 w-full"
          placeholder="Alex Smith"
        />
        {errors.emergencyContactName && (
          <ErrorText>{errors.emergencyContactName}</ErrorText>
        )}

        <label className="block mt-4 mb-1 font-medium">Relation</label>
        <input
          name="emergencyContactRelation"
          value={formData.emergencyContactRelation}
          onChange={handleChange}
          className="border p-2 w-full"
          placeholder="Friend / Parent / Sibling…"
        />
        {errors.emergencyContactRelation && (
          <ErrorText>{errors.emergencyContactRelation}</ErrorText>
        )}

        <label className="block mt-4 mb-1 font-medium">Contact Phone</label>
        <input
          name="emergencyContactPhone"
          value={formData.emergencyContactPhone}
          onChange={handleChange}
          className="border p-2 w-full"
          placeholder="(604) 555-0123"
        />
        {errors.emergencyContactPhone && (
          <ErrorText>{errors.emergencyContactPhone}</ErrorText>
        )}
      </div>

      {/* Waiver */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Waiver</h3>
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            name="waiverSigned"
            checked={formData.waiverSigned}
            onChange={handleChange}
            className="mr-2"
          />
          <span>
            I have read and agreed to the{" "}
            <a
              href="https://drive.google.com/file/d/1QsYcL9lLM6DOuoZ5VjC5avfe4BSqhTr7/view"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              waiver form
            </a>
            .
          </span>
        </label>
        {errors.waiverSigned && <ErrorText>{errors.waiverSigned}</ErrorText>}
      </div>

      {/* Payment-first UX */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Membership & Payment</h3>

        <label className="block mb-1 font-medium">Payment Type</label>
        <select
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleChange}
          className="border p-2 w-full mb-2"
        >
          <option value="">Choose payment type…</option>
          <option value="online">Online (Stripe)</option>
          <option value="cash">Cash (paid in-person)</option>
        </select>
        {errors.paymentMethod && <ErrorText>{errors.paymentMethod}</ErrorText>}

        <label className="block mt-4 mb-1 font-medium">Membership</label>
        <select
          name="membershipType"
          value={formData.membershipType}
          onChange={handleChange}
          className="border p-2 w-full"
          disabled={!paymentChosen}
        >
          <option value="">
            {paymentChosen ? "Choose membership…" : "Select payment type first"}
          </option>
          {paymentChosen && (
            <>
              <option value="term">{membershipOptions.term.label}</option>
              <option value="year">{membershipOptions.year.label}</option>
              <option value="nonstudent">
                {membershipOptions.nonstudent.label}
              </option>
            </>
          )}
        </select>
        {errors.membershipType && (
          <ErrorText>{errors.membershipType}</ErrorText>
        )}

        {formData.paymentMethod === "online" && (
          <div className="text-sm text-gray-700 bg-gray-100 mt-3 p-3 rounded">
            <p>
              You’ll be redirected to a secure Stripe checkout page after
              submission.
            </p>
          </div>
        )}

        {formData.paymentMethod === "cash" && (
          <div className="mt-3">
            <label className="block mb-1 font-medium">
              Name of exec who received your cash payment
            </label>
            <input
              name="cashReceiver"
              value={formData.cashReceiver}
              onChange={handleChange}
              className="border p-2 w-full"
              placeholder="Exec's full name"
            />
            {errors.cashReceiver && (
              <ErrorText>{errors.cashReceiver}</ErrorText>
            )}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="text-center">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canSubmit || status === "loading"}
        >
          {status === "loading" ? "Submitting…" : "Submit"}
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
}
