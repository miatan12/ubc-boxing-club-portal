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

    try {
      const data = new FormData();
      for (const key in formData) {
        if (key !== "startDate" && key !== "expiryDate") {
          data.append(key, formData[key]);
        }
      }
      data.append("startDate", startDate); // only add once
      data.append("expiryDate", expiryDate);
      if (screenshot) data.append("screenshot", screenshot);

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/members`,
        data
      );
      setStatus("success");
      console.log(res.data);
    } catch (err) {
      console.error(err);
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
          <option value="term">4 months (student) - $50</option>
          <option value="year">12 months (student) - $100</option>
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
          <option value="etransfer">E-transfer</option>
          <option value="cash">Cash (paid in-person)</option>
        </select>

        {/* Online Payment */}
        {formData.paymentMethod === "online" && (
          <div className="text-sm text-gray-700 bg-gray-100 mt-3 p-3 rounded">
            <p className="whitespace-pre-wrap">
              Pay securely via:{" "}
              <a
                href="https://your-stripe-link.com"
                className="text-blue-600 underline"
                target="_blank"
                rel="noreferrer"
              >
                Stripe Payment Portal
              </a>
            </p>
          </div>
        )}

        {/* E-transfer */}
        {formData.paymentMethod === "etransfer" && (
          <div className="text-sm text-gray-700 bg-gray-100 mt-3 p-3 rounded space-y-2">
            <p className="whitespace-pre-wrap">
              Send e-transfer to: <strong>deposit@ams.ubc.ca</strong>
              {"\n"}
              Message:{" "}
              <code className="bg-white p-1 rounded text-xs">
                8030-00 50050 - Membership Fee Deposit (Boxing Club)
              </code>
            </p>
            <label className="block text-sm font-medium mt-2">
              Upload Screenshot of Payment Confirmation
              <input
                type="file"
                accept="image/*"
                className="block mt-1"
                onChange={handleFileChange}
              />
            </label>
          </div>
        )}

        {/* Cash Payment */}
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
