import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function AppShell() {
  const isAdmin = sessionStorage.getItem("isAdmin") === "true";

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0b0d] text-neutral-900 dark:text-white">
      {/* Persistent theme toggle only */}
      <ThemeToggle className="fixed z-40 top-3 right-3" />

      {/* Routed content */}
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      {/* Bottom tabs */}
      <BottomTabs
        items={[
          { to: "/", label: "Home", icon: HomeIcon },
          { to: "/register", label: "Register", icon: FormIcon },
          { to: "/renew", label: "Renew", icon: RefreshIcon },
          {
            to: isAdmin ? "/admin" : "/login",
            label: "Admin",
            icon: ShieldIcon,
          },
        ]}
      />
    </div>
  );
}

function BottomTabs({ items }) {
  return (
    <nav
      className="
        fixed bottom-0 inset-x-0 z-30
        bg-white/95 dark:bg-neutral-900/95
        backdrop-blur
        shadow-[0_-8px_16px_rgba(0,0,0,0.12)]
      "
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary tabs"
    >
      <div className="mx-auto max-w-3xl grid grid-cols-4 gap-2 p-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex flex-col items-center justify-center gap-1 rounded-xl py-2",
                "text-xs font-medium transition",
                isActive
                  ? "bg-red-600 text-white"
                  : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
              ].join(" ")
            }
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
function FormIcon({ className = "" }) {
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
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
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
