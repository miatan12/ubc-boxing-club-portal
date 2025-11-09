import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJSON, okOrThrow } from "../lib/api";

/* ===================== Icons & small helpers ===================== */
function inferPaymentType(v) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "—";
  const r = Math.round(n * 100) / 100; // handle 50.0 / 100.00 safely
  const is50 = Math.abs(r - 50) < 0.01;
  const is100 = Math.abs(r - 100) < 0.01;
  return is50 || is100 ? "Cash" : "Online";
}
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
function ChevronDown({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
function ArrowUp({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
function ArrowDown({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 5v14M19 12l-7 7-7-7" />
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

/* ===================== Data helpers ===================== */
function isActiveFromMember(m) {
  if (m?.expiryDate) {
    const d = new Date(m.expiryDate);
    if (!Number.isNaN(d.getTime())) return d.getTime() >= Date.now();
  }
  if (typeof m?.status === "string") return m.status.toLowerCase() === "active";
  return false;
}
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

/* ==== membership normalize via your map + nice labels ==== */
const TYPE_MAP = {
  term: "term",
  semester: "term",
  sem: "term",
  "4m": "term",
  "4-month": "term",
  "4 months": "term",
  year: "year",
  annual: "year",
  "12m": "year",
  "12-month": "year",
  nonstudent: "nonstudent",
  "non-student": "nonstudent",
};
const TYPE_BADGE = {
  term: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  year: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  nonstudent:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};
const TYPE_LABEL = {
  term: "Term",
  year: "Yearly",
  nonstudent: "Non-Student",
};
function normalizeType(raw) {
  if (!raw) return "";
  const k = raw.toString().toLowerCase().trim();
  return TYPE_MAP[k] || "";
}

/* ============== formatters & attendance readers ============== */
function formatCurrencyMaybe(v) {
  const n =
    typeof v === "number" ? v : Number.isFinite(Number(v)) ? Number(v) : null;
  if (n === null) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}
function formatDateMaybe(d) {
  if (!d) return "—";
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return "—";
  return t.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
function fmtRelative(date) {
  if (!date) return "—";
  const ms = new Date(date).getTime() - Date.now();
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  if (Number.isNaN(days)) return "—";
  if (days > 0) return `in ${days} day${days === 1 ? "" : "s"}`;
  if (days === 0) return "today";
  return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
}
/** Try to read the latest attendance date from various shapes:
 * - ISO strings: "2025-01-01T12:00:00Z"
 * - objects with {date} or {at} or {timestamp}
 */
function getLastAttendanceAt(m) {
  if (!Array.isArray(m?.attendance) || m.attendance.length === 0) return null;
  let latest = null;
  for (const item of m.attendance) {
    let d = null;
    if (typeof item === "string") d = new Date(item);
    else if (item && typeof item === "object") {
      d = new Date(
        item.date || item.at || item.timestamp || item.time || item.checkedInAt
      );
    }
    if (d && !Number.isNaN(d.getTime())) {
      if (!latest || d.getTime() > latest.getTime()) latest = d;
    }
  }
  return latest;
}
function daysUntil(date) {
  if (!date) return Infinity;
  const diff = new Date(date).getTime() - Date.now();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/* =============== click-away hook for dropdowns ================== */
function useClickAway(onAway) {
  const ref = useRef(null);
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onAway();
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [onAway]);
  return ref;
}

/* ======================= Sort Dropdown ========================== */
function SortDropdown({ sortKey, sortDir, setSortKey, setSortDir }) {
  const [open, setOpen] = useState(false);
  const ref = useClickAway(() => setOpen(false));

  const labelMap = {
    attendance: "Attendance",
    expiry: "Expiry",
    alphabet: "Alphabet",
  };
  const currentLabel = labelMap[sortKey] || "Sort";
  const DirIcon = sortDir === "asc" ? ArrowUp : ArrowDown;

  const onSelectKeyToggle = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      if (key === "alphabet") setSortDir("asc");
      if (key === "attendance") setSortDir("desc");
      if (key === "expiry") setSortDir("asc");
    }
    setOpen(false);
  };

  const Item = ({ k, children }) => (
    <button
      onClick={() => onSelectKeyToggle(k)}
      className={[
        "w-full text-left px-3 py-2 rounded-lg",
        sortKey === k
          ? "bg-red-600 text-white"
          : "hover:bg-neutral-100 dark:hover:bg-neutral-800",
      ].join(" ")}
      role="menuitem"
    >
      <div className="flex items-center justify-between">
        <span>{children}</span>
        {sortKey === k ? <DirIcon className="h-4 w-4 opacity-80" /> : null}
      </div>
    </button>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
      >
        <span className="font-medium">{currentLabel}</span>
        <DirIcon className="h-4 w-4" />
        <ChevronDown className="h-4 w-4 opacity-70" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute z-40 mt-2 w-56 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-2 shadow-xl"
        >
          <Item k="attendance">Attendance</Item>
          <Item k="expiry">Expiry date</Item>
          <Item k="alphabet">Alphabet</Item>
          <div className="mt-2 px-2 text-xs text-neutral-500 dark:text-neutral-400">
            Tip: pick the same item again to flip ↑ / ↓
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================= Filter Dropdown ======================== */
function FilterDropdown({
  filterExpired,
  filterType,
  setFilterExpired,
  setFilterType,
}) {
  const [open, setOpen] = useState(false);
  const ref = useClickAway(() => setOpen(false));

  const friendly = (s) => s[0].toUpperCase() + s.slice(1);
  const summary = `Expired: ${friendly(filterExpired)} · Membership: ${friendly(
    filterType
  )}`;

  const RadioRow = ({ title, options, value, onChange }) => (
    <div className="mb-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400 mb-1">
        {title}
      </div>
      <div className="space-y-1">
        {options.map((opt) => {
          const checked = value === opt.value;
          return (
            <label
              key={opt.value}
              className={[
                "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer",
                checked
                  ? "bg-red-600 text-white"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800",
              ].join(" ")}
            >
              <span>{opt.label}</span>
              <input
                type="radio"
                className="accent-red-600"
                name={title}
                checked={checked}
                onChange={() => onChange(opt.value)}
              />
            </label>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
      >
        <span className="font-medium">Filter</span>
        <span className="text-xs text-neutral-600 dark:text-neutral-400 max-w-[14rem] truncate">
          {summary}
        </span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-80 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-3 shadow-xl">
          <RadioRow
            title="Expired"
            value={filterExpired}
            onChange={(v) => setFilterExpired(v)}
            options={[
              { value: "all", label: "All" },
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
          <RadioRow
            title="Membership"
            value={filterType}
            onChange={(v) => setFilterType(v)}
            options={[
              { value: "all", label: "All" },
              { value: "yearly", label: "Yearly" },
              { value: "term", label: "Term" },
            ]}
          />
          <div className="pt-1 text-right">
            <button
              onClick={() => {
                setFilterExpired("all");
                setFilterType("all");
                setOpen(false);
              }}
              className="text-xs underline text-neutral-600 dark:text-neutral-300"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================= Main Component ========================= */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sort & Filter state
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

      const mt = normalizeType(m.membershipType);
      if (filterType === "yearly" && mt !== "year") return false;
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

        {/* Controls: dropdowns */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <SortDropdown
            sortKey={sortKey}
            sortDir={sortDir}
            setSortKey={setSortKey}
            setSortDir={setSortDir}
          />
          <FilterDropdown
            filterExpired={filterExpired}
            filterType={filterType}
            setFilterExpired={setFilterExpired}
            setFilterType={setFilterType}
          />
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
            const expiryDate = member.expiryDate || null;
            const expiryFormatted = formatDateMaybe(expiryDate);
            const relative = fmtRelative(expiryDate);
            const classesCount = getAttendanceCount(member);

            const nType = normalizeType(member.membershipType);
            const typeBadge = TYPE_BADGE[nType];
            const typeLabel = TYPE_LABEL[nType];

            const lastAt = getLastAttendanceAt(member);
            const lastAtStr = formatDateMaybe(lastAt);
            const lastAtRel = fmtRelative(lastAt);

            const days = daysUntil(expiryDate);
            const soon = Number.isFinite(days) && days >= 0 && days <= 14;

            return (
              <div
                key={member._id || member.email || member.name}
                className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-4 shadow-sm"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold truncate">
                      {member.name || "—"}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 truncate">
                      {member.email || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {soon && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                        Expires soon
                      </span>
                    )}
                    {nType ? (
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeBadge}`}
                      >
                        {typeLabel}
                      </span>
                    ) : null}
                    <StatusBadge active={active} />
                  </div>
                </div>

                {/* Info grid (only render tiles that have something meaningful) */}
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  {/* Payment type */}
                  <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/60 p-3">
                    <div className="text-neutral-600 dark:text-neutral-300">
                      Payment type
                    </div>
                    <div className="font-semibold">
                      {inferPaymentType(member.paymentAmount)}
                    </div>
                  </div>

                  {/* Expires */}
                  <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/60 p-3">
                    <div className="text-neutral-600 dark:text-neutral-300">
                      Expires
                    </div>
                    <div className="font-semibold">{expiryFormatted}</div>
                    <div className="text-xs text-neutral-500">{relative}</div>
                  </div>

                  {/* Classes attended */}
                  <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/60 p-3">
                    <div className="text-neutral-600 dark:text-neutral-300">
                      Classes attended
                    </div>
                    <div className="font-semibold">{classesCount}</div>
                  </div>

                  {/* Last attended (if we can infer a date) */}
                  {lastAt && (
                    <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/60 p-3">
                      <div className="text-neutral-600 dark:text-neutral-300">
                        Last attended
                      </div>
                      <div className="font-semibold">{lastAtStr}</div>
                      <div className="text-xs text-neutral-500">
                        {lastAtRel}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
