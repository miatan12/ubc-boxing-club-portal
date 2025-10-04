import React from "react";
import { Link } from "react-router-dom";

export default function SignUp() {
  const Card = ({ to, title, desc, icon }) => (
    <Link
      to={to}
      className="block rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-black/20 p-5 hover:bg-white/80 dark:hover:bg-black/25 transition"
      aria-label={title}
    >
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-300">
            {desc}
          </p>
        </div>
      </div>
    </Link>
  );

  return (
    <main className="min-h-screen bg-white dark:bg-[#0a0b0d] text-neutral-900 dark:text-white pb-24">
      <div className="mx-auto max-w-xl px-5 pt-6">
        <h1 className="text-2xl font-bold">Membership</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          Choose what you need today.
        </p>

        <div className="mt-5 grid gap-4">
          <Card
            to="/register"
            title="Register"
            desc="New member? Start your membership."
            icon={<FormIcon className="h-6 w-6" />}
          />
          <Card
            to="/renew"
            title="Renew"
            desc="Keep your existing membership active."
            icon={<RefreshIcon className="h-6 w-6" />}
          />
          <Card
            to="/drop-in"
            title="Drop-in"
            desc="Just visiting? Buy a single class pass."
            icon={<TicketIcon className="h-6 w-6" />}
          />
        </div>
      </div>
    </main>
  );
}

/* Small inline icons to match your style */
function FormIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 12h8M8 17h5" />
    </svg>
  );
}
function RefreshIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}
function TicketIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2V7z" />
    </svg>
  );
}
