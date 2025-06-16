import React, { useState } from "react";
import axios from "axios";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    studentNumber: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    waiverSigned: false,
    membershipType: "term",
    startDate: "",
    expiryDate: "",
    paymentMethod: "",
    cashReceiver: "",
  });

  const [screenshot, setScreenshot] = useState(null);
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    setScreenshot(e.target.files[0]);
  };

  const calculateExpiry = (membershipType) => {
    const start = new Date();
    const expiry = new Date(start);
    if (membershipType === "term") expiry.setMonth(start.getMonth() + 4);
    if (membershipType === "year") expiry.setMonth(start.getMonth() + 12);
    return {
      startDate: start.toISOString(),
      expiryDate: expiry.toISOString(),
    };
  };

  const getStripePricing = (type) => {
    return {
      term: {
        amount: 5155,
        label: "4 months (student) - $51.55",
      },
      year: {
        amount: 10310,
        label: "12 months (student) - $103.10",
      },
    }[type];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { startDate, expiryDate } = calculateExpiry(formData.membershipType);

    if (formData.paymentMethod === "cash" && !formData.cashReceiver.trim()) {
      setStatus("error");
      alert(
        "Please enter the name of the exec who received your cash payment."
      );
      return;
    }

    if (formData.paymentMethod === "online") {
      const payload = { ...formData, startDate, expiryDate };
      localStorage.setItem("boxing-form", JSON.stringify(payload));

      const { amount, label } = getStripePricing(formData.membershipType);

      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/checkout/create-checkout-session`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, label }),
          }
        );

        if (!res.ok) {
          alert("Server error while creating payment session.");
          return;
        }

        const data = await res.json();
        sessionStorage.setItem("submittedToStripe", "true");
        window.location.href = data.url;
      } catch (err) {
        console.error("Stripe redirect error:", err);
        setStatus("error");
        alert("Failed to redirect to payment page.");
      }

      return;
    }

    // Cash payment path
    try {
      const data = new FormData();
      for (const key in formData) {
        if (key !== "startDate" && key !== "expiryDate") {
          data.append(key, formData[key]);
        }
      }
      data.append("startDate", startDate);
      data.append("expiryDate", expiryDate);
      if (screenshot) data.append("screenshot", screenshot);

      await axios.post(`${process.env.REACT_APP_API_URL}/api/members`, data);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 p-6 max-w-xl mx-auto bg-white shadow rounded"
    >
      <h2 className="text-2xl font-bold text-center">
        UBC Boxing Club Registration
      </h2>

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
          placeholder="Email"
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />
      </div>

      {/* Emergency Contact Info */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Emergency Contact Info</h3>
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

      {/* Membership + Payment */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Membership & Payment</h3>

        <label className="block mb-2 font-medium">Membership Type</label>
        <select
          name="membershipType"
          onChange={handleChange}
          className="border p-2 w-full mb-4"
        >
          <option value="term">
            4 months (student): $50 cash / $51.55 online
          </option>
          <option value="year">
            12 months (student): $100 cash / $103.10 online
          </option>
        </select>

        <label className="block mb-2 font-medium">Payment Method</label>
        <select
          name="paymentMethod"
          onChange={handleChange}
          className="border p-2 w-full mb-4"
          required
        >
          <option value="">Select a payment method</option>
          <option value="online">Online Payment (Stripe)</option>
          <option value="cash">Cash (paid in-person)</option>
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
            Successfully submitted!
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
