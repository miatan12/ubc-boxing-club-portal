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

  const isActive = (expiryDate) => {
    return new Date(expiryDate) >= new Date();
  };

  const filteredMembers = members.filter((member) => {
    if (filter === "all") return true;
    if (filter === "active") return isActive(member.expiryDate);
    if (filter === "expired") return !isActive(member.expiryDate);
    return false;
  });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Admin Dashboard</h1>

      <div className="flex justify-center gap-4 mb-6">
        {["all", "active", "expired"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded border font-medium ${
              filter === type
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-800 hover:bg-gray-100"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredMembers.map((member, index) => {
          const active = isActive(member.expiryDate);
          const expiryFormatted = new Date(
            member.expiryDate
          ).toLocaleDateString();

          return (
            <div
              key={index}
              className={`rounded-lg border p-4 shadow-sm ${
                active ? "bg-white" : "bg-red-50"
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">{member.name}</h3>
                <span
                  className={`text-sm font-medium px-2 py-1 rounded ${
                    active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {active ? "Active" : "Expired"}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Payment:{" "}
                <strong>
                  {member.paymentAmount ? `$${member.paymentAmount}` : "N/A"}
                </strong>
              </p>
              <p className="text-sm text-gray-600">
                Expires: {expiryFormatted}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboard;
