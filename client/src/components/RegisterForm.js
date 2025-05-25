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

  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
      const res = await axios.post(`/api/members`, {
        ...formData,
        startDate,
        expiryDate,
      });
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
          className="border p-2 w-full"
          required
        >
          <option value="">Select a payment method</option>
          <option value="online">E-transfer or Online Payment</option>
          <option value="cash">Cash (paid in-person)</option>
        </select>

        {formData.paymentMethod === "online" && (
          <div className="text-sm text-gray-700 bg-gray-100 mt-3 p-3 rounded">
            <p>
              Send e-transfer to: <strong>deposit@ams.ubc.ca</strong>
              <br />
              Message:{" "}
              <code className="bg-white p-1 rounded text-xs">
                8030-00 50050 - Membership Fee Deposit (Boxing Club)
              </code>
              <br />
              Or pay via:{" "}
              <a
                href="https://your-stripe-link.com"
                className="text-blue-600 underline"
                target="_blank"
                rel="noreferrer"
              >
                Online Payment
              </a>
            </p>
          </div>
        )}

        {formData.paymentMethod === "cash" && (
          <input
            name="cashReceiver"
            placeholder="Name of exec who received your cash"
            onChange={handleChange}
            className="border p-2 w-full mt-3"
            required
          />
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
