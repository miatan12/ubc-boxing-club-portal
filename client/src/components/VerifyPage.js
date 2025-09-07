import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

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

function StatusBadge({ status }) {
  const isActive = (status || "").toLowerCase() === "active";
  return (
    <span
      className={[
        "text-xs font-semibold px-2.5 py-1 rounded-full",
        isActive
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      ].join(" ")}
    >
      {status ? status[0].toUpperCase() + status.slice(1) : "—"}
    </span>
  );
}

export default function VerifyPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [state, setState] = useState("idle"); // idle | loading | done | error
  const [checkedIn, setCheckedIn] = useState({}); // { key: timeString }
  const [checking, setChecking] = useState({}); // { key: true }
  const abortRef = useRef(null);

  // Abortable search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!query.trim()) {
        if (abortRef.current) abortRef.current.abort();
        setResults([]);
        setState("idle");
        return;
      }

      setState("loading");
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      fetch(
        `http://localhost:5050/api/members/search?query=${encodeURIComponent(
          query.trim()
        )}`,
        { signal: controller.signal }
      )
        .then((res) => {
          if (!res.ok) throw new Error("Search failed.");
          return res.json();
        })
        .then((data) => {
          setResults(Array.isArray(data) ? data : []);
          setState("done");
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          setState("error");
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Prefer an exact, unique identifier for check-in
  const handleCheckIn = useCallback(async (member, stableKey) => {
    const now = new Date();

    const body = member.id
      ? { memberId: member.id }
      : member.email
      ? { email: member.email }
      : { emailOrName: member.name, exact: true }; // last resort

    try {
      setChecking((prev) => ({ ...prev, [stableKey]: true }));

      const res = await fetch("http://localhost:5050/api/members/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to check in.");
      const data = await res.json();

      const key = data._id || data.email || stableKey;
      const timeStr = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      setCheckedIn((prev) => ({ ...prev, [key]: timeStr }));
    } catch (e) {
      alert("Check-in failed. Please try again.");
    } finally {
      setChecking((prev) => ({ ...prev, [stableKey]: false }));
    }
  }, []);

  const empty = state === "done" && results.length === 0;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0b0d] text-neutral-900 dark:text-white pb-24">
      {/* Header */}
      <header className="mx-auto max-w-xl px-5 pt-6">
        <button
          onClick={() => navigate("/admin")}
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <h2 className="mt-4 text-3xl font-extrabold tracking-tight">
          Member Check-In
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          Search by name or email, then check in active members.
        </p>

        {/* Search */}
        <div className="mt-4 relative">
          <input
            type="text"
            placeholder="Search by name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-4 py-3 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 dark:text-neutral-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        </div>

        {/* States */}
        <div className="mt-3 text-sm">
          {state === "idle" && (
            <span className="text-neutral-600 dark:text-neutral-300">
              Start typing to search…
            </span>
          )}
          {state === "loading" && (
            <span className="text-neutral-600 dark:text-neutral-300">
              Searching…
            </span>
          )}
          {state === "error" && (
            <span className="text-red-600 dark:text-red-400">
              Something went wrong.
            </span>
          )}
          {empty && (
            <span className="text-neutral-600 dark:text-neutral-300">
              No members found.
            </span>
          )}
        </div>
      </header>

      {/* Results */}
      <div className="mx-auto max-w-xl px-5 mt-4">
        <div className="space-y-4">
          {results.map((m) => {
            const stableKey = m.id || m.email || m.name;
            const isActive = (m.status || "").toLowerCase() === "active";
            const displayKey = m.id || m.email || stableKey;
            const wasCheckedIn = !!checkedIn[displayKey];

            const expiry = m.expiryDate
              ? new Date(m.expiryDate).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "—";

            return (
              <div
                key={displayKey}
                className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{m.name || "—"}</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                      {m.email || "—"}
                    </p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/60 p-3">
                    <div className="text-neutral-600 dark:text-neutral-300">
                      Payment
                    </div>
                    <div className="font-semibold">
                      {m.paymentAmount ? `$${m.paymentAmount}` : "N/A"}
                    </div>
                  </div>
                  <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/60 p-3">
                    <div className="text-neutral-600 dark:text-neutral-300">
                      Expiry
                    </div>
                    <div className="font-semibold">{expiry}</div>
                  </div>
                </div>

                {isActive && (
                  <div className="mt-4">
                    {wasCheckedIn ? (
                      <div className="inline-flex items-center gap-2 rounded-xl bg-green-600/10 text-green-700 dark:text-green-300 px-3 py-2 text-sm font-medium">
                        ✅ Checked in at {checkedIn[displayKey]}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCheckIn(m, stableKey)}
                        disabled={!!checking[stableKey]}
                        className={[
                          "rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                          checking[stableKey]
                            ? "bg-red-400 text-white cursor-not-allowed"
                            : "bg-red-600 text-white hover:bg-red-700",
                        ].join(" ")}
                      >
                        {checking[stableKey] ? "Checking in…" : "Check In"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
