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
      console.log("Server response:", data);
      setResult(data);
      setStatus("done");
      setQuery(""); // Clear input after check
    } catch (err) {
      console.error("Verification failed:", err);
      setStatus("error");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleCheck();
    }
  };

  const handleReset = () => {
    setQuery("");
    setResult(null);
    setStatus("idle");
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Member Check-In</h2>

      <input
        type="text"
        placeholder="Enter name or email"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="border p-2 w-full mb-4 rounded"
      />

      <button
        onClick={handleCheck}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full"
      >
        Check
      </button>

      <div className="mt-6 text-lg font-semibold text-center">
        {status === "loading" && <p>Checking...</p>}
        {status === "error" && (
          <p className="text-red-600">Something went wrong.</p>
        )}
        {status === "done" && result && (
          <div
            className={`rounded-md p-4 mt-6 text-center border-2 ${
              result.active
                ? "border-green-600 bg-green-50 text-green-800"
                : "border-red-600 bg-red-50 text-red-800"
            }`}
          >
            {result.active ? (
              <>
                <div className="text-2xl font-bold mb-2">✅ Access Granted</div>
                <div>
                  {result.name} is an <strong>active member</strong>
                  <br />
                  <span className="text-sm text-gray-700">
                    Expiry: {new Date(result.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold mb-2">❌ Access Denied</div>
                <div>
                  {result.name}&apos;s membership <strong>expired</strong>
                  <br />
                  <span className="text-sm text-gray-700">
                    Expiry: {new Date(result.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              </>
            )}
            <button
              onClick={() => {
                setQuery("");
                setStatus("idle");
                setResult(null);
              }}
              className="mt-4 text-blue-600 underline hover:text-blue-800"
            >
              Check another member
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyPage;
