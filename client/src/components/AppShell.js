import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function AppShell() {
  const isAdmin = sessionStorage.getItem("isAdmin") === "true";

  const tabs = [
    { to: "/", label: "Home", icon: HomeIcon },
    { to: "/sign-up", label: "Sign Up", icon: SignupIcon },
    {
      to: isAdmin ? "/admin" : "/login",
      label: "Admin",
      icon: ShieldIcon,
    },
    { to: "/info", label: "Info", icon: InfoIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0b0d] text-neutral-900 dark:text-white">
      {/* Persistent theme toggle only */}
      <ThemeToggle className="fixed z-40 top-3 right-3" />

      {/* Routed content */}
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      {/* Bottom tabs */}
      <BottomTabs items={tabs} />
    </div>
  );
}

function BottomTabs({ items }) {
  // Create a Tailwind grid cols class based on item count (2–5 supported)
  const cols =
    items.length === 2
      ? "grid-cols-2"
      : items.length === 3
      ? "grid-cols-3"
      : items.length === 4
      ? "grid-cols-4"
      : items.length === 5
      ? "grid-cols-5"
      : "grid-cols-4";

  return (
    <nav
      className="
        fixed bottom-0 inset-x-0 z-30
        bg-white/95 dark:bg-neutral-900/95 backdrop-blur
        shadow-[0_-8px_16px_rgba(0,0,0,0.12)]
      "
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary tabs"
    >
      <div className={`mx-auto max-w-3xl grid ${cols} gap-2 p-2`}>
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs font-medium transition",
                isActive
                  ? "bg-red-600 text-white"
                  : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
              ].join(" ")
            }
            aria-label={label}
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={
                    "h-5 w-5 " + (isActive ? "text-white" : "text-current")
                  }
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/* Icons */
function HomeIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function SignupIcon({ className = "" }) {
  // “how-to-register” style: person + plus
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
      <path d="M2 21a6 6 0 0 1 12 0" />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
    </svg>
  );
}

function ShieldIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2 4.5 5v6c0 5 3.5 8.5 7.5 11 4-2.5 7.5-6 7.5-11V5L12 2z" />
      <path d="M9.5 12.5 11 14l3.5-3.5" />
    </svg>
  );
}

function InfoIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8h.01" />
      <path d="M11 12h2v6h-2z" />
    </svg>
  );
}
