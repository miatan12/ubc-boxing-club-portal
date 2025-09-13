// src/components/RegisterForm.jsx
import React, { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { postJSON, okOrThrow, apiUrl } from "../lib/api";

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

const ErrorText = ({ children }) => (
  <p className="text-sm text-red-600 mt-1">{children}</p>
);

export default function RegisterForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    studentNumber: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    waiverSigned: false,
    paymentMethod: "",
    membershipType: "",
    startDate: "",
    expiryDate: "",
    cashReceiver: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(""); // "", "success", "error", "loading"

  const ORIGIN = window.location.origin;

  const paymentChosen = !!formData.paymentMethod;
  const membershipOptions = paymentChosen
    ? PRICES[formData.paymentMethod]
    : null;

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
    if (membershipType === "nonstudent") expiry.setMonth(start.getMonth() + 4);
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
      const first = Object.values(eMap)[0];
      toast.error(String(first));
      return;
    }

    const { startDate, expiryDate } = calculateExpiry(formData.membershipType);
    const emailNorm = formData.email.trim().toLowerCase();

    if (formData.paymentMethod === "online") {
      // Save payload for /success page to POST /api/members after Stripe
      const payloadToSave = {
        ...formData,
        email: emailNorm,
        startDate,
        expiryDate,
      };
      localStorage.setItem("boxing-form", JSON.stringify(payloadToSave));

      const pricing = PRICES.online[formData.membershipType];
      try {
        setStatus("loading");
        const t = toast.loading("Redirecting to secure checkout…");

        const res = await postJSON("/api/checkout/create-checkout-session", {
          plan: formData.membershipType, // server enforces price
          label: pricing.label,
          type: "register", // flow
          successUrl: `${ORIGIN}/success`,
          cancelUrl: `${ORIGIN}/register`,
        });
        await okOrThrow(res, "Could not create payment session");

        const data = await res.json();
        toast.dismiss(t);

        if (!data?.url) {
          toast.error("Could not create payment session. Try again.");
          setStatus("error");
          return;
        }
        sessionStorage.setItem("submittedToStripe", "true");
        window.location.href = data.url; // Stripe Checkout
      } catch (err) {
        console.error("Stripe redirect error:", err);
        setStatus("error");
        toast.error("Failed to open payment page. Please try again.");
      }
      return;
    }

    // Cash flow — send multipart/form-data to /api/members (multer route)
    try {
      setStatus("loading");
      const fd = new FormData();
      Object.entries({
        ...formData,
        email: emailNorm,
        startDate,
        expiryDate,
      }).forEach(([k, v]) => fd.append(k, v));

      const res = await fetch(apiUrl("/api/members"), {
        method: "POST",
        body: fd,
      });
      await okOrThrow(res, "Submission failed");
      await res.json(); // not used, but ensures parse works

      toast.success("Registered! Redirecting to home…");
      setStatus("success");
      setTimeout(() => navigate("/", { replace: true }), 1400);
    } catch (err) {
      console.error("Cash submission failed:", err);
      setStatus("error");
      toast.error("Submission failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0b0d] text-neutral-900 dark:text-white pb-24">
      <div className="mx-auto max-w-xl px-5 pt-6">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          UBC Boxing Club Registration
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          Please fill out your details below.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-7 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-6 shadow-sm"
          noValidate
        >
          {/* Personal Info */}
          <section>
            <h3 className="text-base font-semibold mb-3">Personal Info</h3>

            <label className="block mb-1 text-sm font-medium">Full Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="John Doe"
            />
            {errors.name && <ErrorText>{errors.name}</ErrorText>}

            <label className="block mt-4 mb-1 text-sm font-medium">
              Student Number
            </label>
            <input
              name="studentNumber"
              value={formData.studentNumber}
              onChange={handleChange}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="12345678"
            />
            {errors.studentNumber && (
              <ErrorText>{errors.studentNumber}</ErrorText>
            )}

            <label className="block mt-4 mb-1 text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="you@example.com"
            />
            {errors.email && <ErrorText>{errors.email}</ErrorText>}
          </section>

          {/* Emergency Contact */}
          <section>
            <h3 className="text-base font-semibold mb-3">Emergency Contact</h3>

            <label className="block mb-1 text-sm font-medium">
              Contact Name
            </label>
            <input
              name="emergencyContactName"
              value={formData.emergencyContactName}
              onChange={handleChange}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="Jane Doe"
            />
            {errors.emergencyContactName && (
              <ErrorText>{errors.emergencyContactName}</ErrorText>
            )}

            <label className="block mt-4 mb-1 text-sm font-medium">
              Relation
            </label>
            <input
              name="emergencyContactRelation"
              value={formData.emergencyContactRelation}
              onChange={handleChange}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="Friend / Parent / Sibling…"
            />
            {errors.emergencyContactRelation && (
              <ErrorText>{errors.emergencyContactRelation}</ErrorText>
            )}

            <label className="block mt-4 mb-1 text-sm font-medium">
              Contact Phone
            </label>
            <input
              name="emergencyContactPhone"
              value={formData.emergencyContactPhone}
              onChange={handleChange}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="(604) 555-0123"
            />
            {errors.emergencyContactPhone && (
              <ErrorText>{errors.emergencyContactPhone}</ErrorText>
            )}
          </section>

          {/* Waiver */}
          <section>
            <h3 className="text-base font-semibold mb-3">Waiver</h3>
            <label className="inline-flex items-center text-sm">
              <input
                type="checkbox"
                name="waiverSigned"
                checked={formData.waiverSigned}
                onChange={handleChange}
                className="mr-2 h-4 w-4 rounded border-black/10 dark:border-white/10 focus:ring-red-600"
              />
              <span>
                I have read and agreed to the{" "}
                <a
                  href="https://drive.google.com/file/d/1QsYcL9lLM6DOuoZ5VjC5avfe4BSqhTr7/view"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 dark:text-red-400 underline underline-offset-4"
                >
                  waiver form
                </a>
                .
              </span>
            </label>
            {errors.waiverSigned && (
              <ErrorText>{errors.waiverSigned}</ErrorText>
            )}
          </section>

          {/* Payment-first UX */}
          <section>
            <h3 className="text-base font-semibold mb-3">
              Membership & Payment
            </h3>

            <label className="block mb-1 text-sm font-medium">
              Payment Type
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 mb-2"
            >
              <option value="">Choose payment type…</option>
              <option value="online">Online (Stripe)</option>
              <option value="cash">Cash (paid in-person)</option>
            </select>
            {errors.paymentMethod && (
              <ErrorText>{errors.paymentMethod}</ErrorText>
            )}

            <label className="block mt-4 mb-1 text-sm font-medium">
              Membership
            </label>
            <select
              name="membershipType"
              value={formData.membershipType}
              onChange={handleChange}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-60"
              disabled={!paymentChosen}
            >
              <option value="">
                {paymentChosen
                  ? "Choose membership…"
                  : "Select payment type first"}
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
              <div className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800/60 mt-3 p-3 rounded-xl">
                You’ll be redirected to a secure Stripe checkout page after
                submission.
              </div>
            )}

            {formData.paymentMethod === "cash" && (
              <div className="mt-3">
                <label className="block mb-1 text-sm font-medium">
                  Name of exec who received your cash payment
                </label>
                <input
                  name="cashReceiver"
                  value={formData.cashReceiver}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="Exec's full name"
                />
                {errors.cashReceiver && (
                  <ErrorText>{errors.cashReceiver}</ErrorText>
                )}
              </div>
            )}
          </section>

          {/* Submit */}
          <div className="text-center">
            <button
              type="submit"
              className={[
                "rounded-2xl px-6 py-2.5 text-sm font-semibold transition",
                !canSubmit || status === "loading"
                  ? "bg-red-400 text-white cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700",
              ].join(" ")}
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
      </div>
    </div>
  );
}
