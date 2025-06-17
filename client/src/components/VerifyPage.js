import React, { useState, useEffect } from "react";

const VerifyPage = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle");
  const [checkedIn, setCheckedIn] = useState({}); // { email: timestamp }

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim().length === 0) {
        setResults([]);
        setStatus("idle");
        return;
      }

      const fetchResults = async () => {
        setStatus("loading");

        try {
          const res = await fetch(
            `http://localhost:5050/api/members/search?query=${encodeURIComponent(
              query.trim()
            )}`
          );
          const data = await res.json();
          setResults(data);
          setStatus("done");
        } catch (err) {
          console.error("Search failed:", err);
          setStatus("error");
        }
      };

      fetchResults();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleCheckIn = async (email) => {
    const now = new Date();

    try {
      const res = await fetch("http://localhost:5050/api/members/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailOrName: email }),
      });

      if (!res.ok) {
        throw new Error("Failed to check in.");
      }

      const data = await res.json();

      setCheckedIn((prev) => ({
        ...prev,
        [email]: now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

      console.log(
        `✅ Check-in success: ${data.name} (Total: ${data.totalClasses})`
      );
    } catch (err) {
      console.error("❌ Check-in failed:", err);
      alert("Check-in failed. Please try again.");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Member Check-In</h2>

      <input
        type="text"
        placeholder="Search by name or email"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border p-2 w-full mb-4 rounded"
      />

      {status === "loading" && (
        <p className="text-center text-gray-500">Searching...</p>
      )}
      {status === "error" && (
        <p className="text-center text-red-600">Something went wrong.</p>
      )}
      {status === "done" && results.length === 0 && (
        <p className="text-center text-gray-600">No members found.</p>
      )}

      <div className="space-y-4">
        {results.map((member, index) => {
          const isCheckedIn = !!checkedIn[member.email];
          const expiryFormatted = new Date(
            member.expiryDate
          ).toLocaleDateString();

          return (
            <div
              key={index}
              className={`rounded-lg border p-4 shadow-sm ${
                member.status === "active" ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{member.name}</h3>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                <span
                  className={`text-sm font-medium px-2 py-1 rounded ${
                    member.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {member.status.charAt(0).toUpperCase() +
                    member.status.slice(1)}
                </span>
              </div>

              <p className="text-sm text-gray-600">
                Payment:{" "}
                <strong>
                  {member.paymentAmount ? `$${member.paymentAmount}` : "N/A"}
                </strong>
              </p>
              <p className="text-sm text-gray-600">Expiry: {expiryFormatted}</p>

              {member.status === "active" && (
                <div className="mt-4">
                  {isCheckedIn ? (
                    <div className="text-green-700 font-medium">
                      ✅ Checked in at {checkedIn[member.email]}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCheckIn(member.email)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Check In
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VerifyPage;
