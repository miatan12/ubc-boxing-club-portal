import React, { useState } from "react";

const VerifyPage = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error

  const handleCheck = async () => {
    if (!query.trim()) return;
    setStatus("loading");

    try {
      const res = await fetch(
        `http://localhost:5050/api/members/verify?name=${encodeURIComponent(
          query.trim()
        )}`
      );
      const data = await res.json();
      setResult(data);
      setStatus("done");
    } catch (err) {
      console.error("Verification failed:", err);
      setStatus("error");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Member Check-In</h2>

      <input
        type="text"
        placeholder="Enter name or email"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border p-2 w-full mb-4"
      />

      <button
        onClick={handleCheck}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Check
      </button>

      <div className="mt-6 text-lg font-semibold text-center">
        {status === "loading" && <p>Checking...</p>}
        {status === "error" && (
          <p className="text-red-600">Something went wrong.</p>
        )}
        {status === "done" &&
          result &&
          (result.found ? (
            result.active ? (
              <p className="text-green-600">✅ Active Member</p>
            ) : (
              <p className="text-red-600">❌ Membership Expired</p>
            )
          ) : (
            <p className="text-red-600">❌ Member Not Found</p>
          ))}
      </div>
    </div>
  );
};

export default VerifyPage;
