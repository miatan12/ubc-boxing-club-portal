import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Card({ to, title, desc, Icon }) {
  return (
    <Link
      to={to}
      className="
        block rounded-2xl p-5 bg-white dark:bg-neutral-900
        border border-black/10 dark:border-white/10
        hover:shadow-md transition
      "
    >
      <div className="flex items-center gap-4">
        <div className="h-11 w-11 rounded-xl bg-red-600 text-white grid place-items-center shrink-0">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-lg font-semibold text-neutral-900 dark:text-white">
            {title}
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-300">
            {desc}
          </div>
        </div>
      </div>
    </Link>
  );
}

function QrIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM16 13h2v2h-2zM20 13h1v8h-8v-1h7z" />
    </svg>
  );
}
function GaugeIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 21a9 9 0 1 1 9-9" />
      <path d="M12 12l5-3" />
    </svg>
  );
}
function LogoutIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("isAdmin");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0b0d] text-black dark:text-white pb-24">
      <div className="mx-auto max-w-md px-5 pt-6">
        <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white">
          Admin Tools
        </h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          You’re logged in for this session.
        </p>

        <div className="mt-6 grid gap-4">
          <Card
            to="/verify"
            title="Member Check-In"
            desc="Verify membership status at the door."
            Icon={QrIcon}
          />
          <Card
            to="/dashboard"
            title="Admin Dashboard"
            desc="Review members, payments, and statuses."
            Icon={GaugeIcon}
          />
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 px-4 py-2.5 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        >
          <LogoutIcon className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
