import React, { useEffect, useMemo, useState } from "react";
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

function StatusBadge({ active }) {
  return (
    <span
      className={[
        "text-xs font-semibold px-2.5 py-1 rounded-full",
        active
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      ].join(" ")}
    >
      {active ? "Active" : "Expired"}
    </span>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [filter, setFilter] = useState("all"); // all | active | expired
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isActiveByDate = (expiryDate) => new Date(expiryDate) >= new Date();
  const computeActive = (m) =>
    typeof m.status === "string"
      ? m.status.toLowerCase() === "active"
      : isActiveByDate(m.expiryDate);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("http://localhost:5050/api/members");
        if (!res.ok) throw new Error("Failed to fetch members.");
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to fetch members.");
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    if (filter === "all") return members;
    if (filter === "active") return members.filter((m) => computeActive(m));
    if (filter === "expired") return members.filter((m) => !computeActive(m));
    return members;
  }, [members, filter]);

  const stats = useMemo(() => {
    const active = members.filter((m) => computeActive(m)).length;
    const expired = Math.max(0, members.length - active);
    return { total: members.length, active, expired };
  }, [members]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0b0d] text-neutral-900 dark:text-white pb-24">
      {/* Header */}
      <header className="mx-auto max-w-3xl px-5 pt-6">
        <button
          onClick={() => navigate("/admin")}
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          Manage members and view statuses.
        </p>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-4">
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              Total
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-4">
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              Active
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.active}
            </div>
          </div>
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-4">
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              Expired
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.expired}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 inline-flex rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-1">
          {["all", "active", "expired"].map((type) => {
            const active = filter === type;
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={[
                  "px-4 py-2 rounded-lg text-sm font-medium transition",
                  active
                    ? "bg-red-600 text-white"
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                ].join(" ")}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-5 mt-6">
        {loading && (
          <div className="text-sm text-neutral-600 dark:text-neutral-300">
            Loading members…
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">
            Error: {error}
          </div>
        )}

        {!loading && !error && filteredMembers.length === 0 && (
          <div className="text-sm text-neutral-600 dark:text-neutral-300">
            No members to display.
          </div>
        )}

        <div className="space-y-4">
          {filteredMembers.map((member) => {
            const active = computeActive(member);
            const expiryFormatted = member.expiryDate
              ? new Date(member.expiryDate).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "—";

            return (
              <div
                key={member._id || member.email || member.name}
                className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {member.name || "—"}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                      {member.email || "—"}
                    </p>
                  </div>
                  <StatusBadge active={active} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/60 p-3">
                    <div className="text-neutral-600 dark:text-neutral-300">
                      Payment
                    </div>
                    <div className="font-semibold">
                      {member.paymentAmount
                        ? `$${member.paymentAmount}`
                        : "N/A"}
                    </div>
                  </div>
                  <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/60 p-3">
                    <div className="text-neutral-600 dark:text-neutral-300">
                      Expires
                    </div>
                    <div className="font-semibold">{expiryFormatted}</div>
                  </div>
                  <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/60 p-3">
                    <div className="text-neutral-600 dark:text-neutral-300">
                      Classes
                    </div>
                    <div className="font-semibold">
                      {Array.isArray(member.attendance)
                        ? member.attendance.length
                        : 0}
                    </div>
                  </div>
                  <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/60 p-3">
                    <div className="text-neutral-600 dark:text-neutral-300">
                      Type
                    </div>
                    <div className="font-semibold">
                      {member.membershipType || "—"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
