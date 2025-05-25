import React, { useState } from "react";
import axios from "axios";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    emergencyContact: "",
    waiverSigned: false,
    membershipType: "monthly",
    startDate: "", // we'll autofill this
    expiryDate: "", // this gets auto-calculated
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
    if (membershipType === "monthly") expiry.setMonth(start.getMonth() + 1);
    if (membershipType === "quarterly") expiry.setMonth(start.getMonth() + 3);
    return { startDate: start.toISOString(), expiryDate: expiry.toISOString() };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { startDate, expiryDate } = calculateExpiry(formData.membershipType);

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/members`, {
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
      className="space-y-4 p-6 max-w-md mx-auto bg-white shadow rounded"
    >
      <h2 className="text-xl font-semibold">Register New Member</h2>

      <input
        name="name"
        placeholder="Full Name"
        onChange={handleChange}
        className="border p-2 w-full"
        required
      />
      <input
        name="email"
        placeholder="Email"
        onChange={handleChange}
        className="border p-2 w-full"
        required
      />
      <input
        name="phone"
        placeholder="Phone"
        onChange={handleChange}
        className="border p-2 w-full"
      />
      <input
        name="emergencyContact"
        placeholder="Emergency Contact"
        onChange={handleChange}
        className="border p-2 w-full"
      />

      <label className="block">
        <input type="checkbox" name="waiverSigned" onChange={handleChange} />
        <span className="ml-2">Waiver signed</span>
      </label>

      <select
        name="membershipType"
        onChange={handleChange}
        className="border p-2 w-full"
      >
        <option value="monthly">Monthly</option>
        <option value="quarterly">Quarterly</option>
      </select>

      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Submit
      </button>

      {status === "success" && (
        <p className="text-green-600">Successfully submitted!</p>
      )}
      {status === "error" && (
        <p className="text-red-600">Submission failed. Try again.</p>
      )}
    </form>
  );
};

export default RegisterForm;
