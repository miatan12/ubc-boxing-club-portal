import React, { useEffect, useState } from "react";

const AdminDashboard = () => {
  const [members, setMembers] = useState([]);
  const [filter, setFilter] = useState("all"); // all | active | expired

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("http://localhost:5050/api/members");
        const data = await res.json();
        setMembers(data);
      } catch (err) {
        console.error("Failed to fetch members:", err);
      }
    };
    fetchMembers();
  }, []);

  // Helper to check if membership is active
  const isActive = (expiryDate) => {
    return new Date(expiryDate) >= new Date();
  };

  const filteredMembers = members.filter((member) => {
    if (filter === "all") return true;
    if (filter === "active") return isActive(member.expiryDate);
    if (filter === "expired") return !isActive(member.expiryDate);
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className="px-3 py-1 border rounded"
        >
          All
        </button>
        <button
          onClick={() => setFilter("active")}
          className="px-3 py-1 border rounded"
        >
          Active
        </button>
        <button
          onClick={() => setFilter("expired")}
          className="px-3 py-1 border rounded"
        >
          Expired
        </button>
      </div>

      <div className="space-y-2">
        {filteredMembers.map((member, index) => (
          <div
            key={index}
            className="border p-4 rounded shadow-sm flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{member.name}</p>
              <p className="text-sm text-gray-600">
                Expires: {member.expiryDate}
              </p>
            </div>
            <span
              className={`text-xl ${
                isActive(member.expiryDate) ? "text-green-500" : "text-red-500"
              }`}
            >
              {isActive(member.expiryDate) ? "✅" : "❌"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
