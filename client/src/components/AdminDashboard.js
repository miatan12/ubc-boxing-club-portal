import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJSON, okOrThrow } from "../lib/api";

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

function isActiveFromMember(m) {
  if (m?.expiryDate) {
    const d = new Date(m.expiryDate);
    if (!Number.isNaN(d.getTime())) return d.getTime() >= Date.now();
  }
  if (typeof m?.status === "string") return m.status.toLowerCase() === "active";
  return false;
}

// ---- new helpers ----
function getAttendanceCount(m) {
  if (Array.isArray(m?.attendance)) return m.attendance.length;
  if (typeof m?.attendanceCount === "number") return m.attendanceCount;
  return 0;
}
function parseExpiry(ms) {
  if (!ms) return 0;
  const t = new Date(ms).getTime();
  return Number.isNaN(t) ? 0 : t;
}
function getName(m) {
  return (m?.name || "").toString();
}
function getMembershipType(m) {
  // normalize to "yearly" / "term" / "" (unknown)
  const t = (m?.membershipType || "").toString().toLowerCase();
  if (t.includes("year")) return "yearly";
  if (t.includes("term")) return "term";
  return "";
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---- new UI state ----
  const [sortKey, setSortKey] = useState("attendance"); // "attendance" | "expiry" | "alphabet"
  const [sortDir, setSortDir] = useState("desc"); // "asc" | "desc"
  const [filterExpired, setFilterExpired] = useState("all"); // "all" | "yes" | "no"
  const [filterType, setFilterType] = useState("all"); // "all" | "yearly" | "term"

  useEffect(() => {
    (async () => {
      try {
        const res = await getJSON("/api/members");
        await okOrThrow(res, "Failed to fetch members.");
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to fetch members.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Stats use the full list (not filtered)
  const stats = useMemo(() => {
    const active = members.filter((m) => isActiveFromMember(m)).length;
    const expired = Math.max(0, members.length - active);
    return { total: members.length, active, expired };
  }, [members]);

  // Apply filters
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const isExpired = !isActiveFromMember(m);
      if (filterExpired === "yes" && !isExpired) return false;
      if (filterExpired === "no" && isExpired) return false;

      const mt = getMembershipType(m);
      if (filterType === "yearly" && mt !== "yearly") return false;
      if (filterType === "term" && mt !== "term") return false;

      return true;
    });
  }, [members, filterExpired, filterType]);

  // Apply sorting
  const sortedMembers = useMemo(() => {
    const arr = [...filteredMembers];
    const mult = sortDir === "asc" ? 1 : -1;
    const byName = (a, b) => getName(a).localeCompare(getName(b));

    if (sortKey === "attendance") {
      arr.sort((a, b) => {
        const diff = getAttendanceCount(a) - getAttendanceCount(b);
        return mult * (diff || byName(a, b));
      });
    } else if (sortKey === "expiry") {
      arr.sort((a, b) => {
        const diff = parseExpiry(a.expiryDate) - parseExpiry(b.expiryDate);
        return mult * (diff || byName(a, b));
      });
    } else if (sortKey === "alphabet") {
      arr.sort((a, b) => mult * byName(a, b));
    }
    return arr;
  }, [filteredMembers, sortKey, sortDir]);

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

        {/* Controls: Sort + Filter button groups */}
        <div className="mt-6 space-y-3">
          {/* Sort */}
          <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-2">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              Sort
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {/* Attendance */}
              <div className="flex items-center gap-2">
                <span className="text-sm w-24 text-neutral-700 dark:text-neutral-300">
                  Attendance
                </span>
                <div className="inline-flex rounded-lg overflow-hidden">
                  <button
                    onClick={() => {
                      setSortKey("attendance");
                      setSortDir("desc");
                    }}
                    className={[
                      "px-3 py-1.5 text-sm border border-black/10 dark:border-white/10",
                      sortKey === "attendance" && sortDir === "desc"
                        ? "bg-red-600 text-white"
                        : "bg-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                    ].join(" ")}
                  >
                    High → Low
                  </button>
                  <button
                    onClick={() => {
                      setSortKey("attendance");
                      setSortDir("asc");
                    }}
                    className={[
                      "px-3 py-1.5 text-sm border border-black/10 dark:border-white/10 border-l-0",
                      sortKey === "attendance" && sortDir === "asc"
                        ? "bg-red-600 text-white"
                        : "bg-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                    ].join(" ")}
                  >
                    Low → High
                  </button>
                </div>
              </div>

              {/* Expiry */}
              <div className="flex items-center gap-2">
                <span className="text-sm w-24 text-neutral-700 dark:text-neutral-300">
                  Expiry
                </span>
                <div className="inline-flex rounded-lg overflow-hidden">
                  <button
                    onClick={() => {
                      setSortKey("expiry");
                      setSortDir("asc");
                    }}
                    className={[
                      "px-3 py-1.5 text-sm border border-black/10 dark:border-white/10",
                      sortKey === "expiry" && sortDir === "asc"
                        ? "bg-red-600 text-white"
                        : "bg-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                    ].join(" ")}
                  >
                    Earliest
                  </button>
                  <button
                    onClick={() => {
                      setSortKey("expiry");
                      setSortDir("desc");
                    }}
                    className={[
                      "px-3 py-1.5 text-sm border border-black/10 dark:border-white/10 border-l-0",
                      sortKey === "expiry" && sortDir === "desc"
                        ? "bg-red-600 text-white"
                        : "bg-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                    ].join(" ")}
                  >
                    Latest
                  </button>
                </div>
              </div>

              {/* Alphabet */}
              <div className="flex items-center gap-2">
                <span className="text-sm w-24 text-neutral-700 dark:text-neutral-300">
                  Alphabet
                </span>
                <div className="inline-flex rounded-lg overflow-hidden">
                  <button
                    onClick={() => {
                      setSortKey("alphabet");
                      setSortDir("asc");
                    }}
                    className={[
                      "px-3 py-1.5 text-sm border border-black/10 dark:border-white/10",
                      sortKey === "alphabet" && sortDir === "asc"
                        ? "bg-red-600 text-white"
                        : "bg-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                    ].join(" ")}
                  >
                    A–Z
                  </button>
                  <button
                    onClick={() => {
                      setSortKey("alphabet");
                      setSortDir("desc");
                    }}
                    className={[
                      "px-3 py-1.5 text-sm border border-black/10 dark:border-white/10 border-l-0",
                      sortKey === "alphabet" && sortDir === "desc"
                        ? "bg-red-600 text-white"
                        : "bg-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                    ].join(" ")}
                  >
                    Z–A
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-2">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              Filter
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {/* Expired yes/no/all */}
              <div className="flex items-center gap-2">
                <span className="text-sm w-24 text-neutral-700 dark:text-neutral-300">
                  Expired
                </span>
                <div className="inline-flex rounded-lg overflow-hidden">
                  {["yes", "no", "all"].map((v, i) => (
                    <button
                      key={v}
                      onClick={() => setFilterExpired(v)}
                      className={[
                        "px-3 py-1.5 text-sm border border-black/10 dark:border-white/10",
                        i > 0 ? "border-l-0" : "",
                        filterExpired === v
                          ? "bg-red-600 text-white"
                          : "bg-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                      ].join(" ")}
                    >
                      {v === "yes" ? "Yes" : v === "no" ? "No" : "All"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Membership yearly/term/all */}
              <div className="flex items-center gap-2">
                <span className="text-sm w-24 text-neutral-700 dark:text-neutral-300">
                  Membership
                </span>
                <div className="inline-flex rounded-lg overflow-hidden">
                  {[
                    { k: "yearly", label: "Yearly" },
                    { k: "term", label: "Term" },
                    { k: "all", label: "All" },
                  ].map((opt, i) => (
                    <button
                      key={opt.k}
                      onClick={() => setFilterType(opt.k)}
                      className={[
                        "px-3 py-1.5 text-sm border border-black/10 dark:border-white/10",
                        i > 0 ? "border-l-0" : "",
                        filterType === opt.k
                          ? "bg-red-600 text-white"
                          : "bg-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                      ].join(" ")}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
        {!loading && !error && sortedMembers.length === 0 && (
          <div className="text-sm text-neutral-600 dark:text-neutral-300">
            No members to display.
          </div>
        )}

        <div className="space-y-4">
          {sortedMembers.map((member) => {
            const active = isActiveFromMember(member);
            const expiryFormatted = member.expiryDate
              ? new Date(member.expiryDate).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "—";
            const classesCount = getAttendanceCount(member);

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
                    <div className="font-semibold">{classesCount}</div>
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
