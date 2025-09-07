import React, { useEffect, useState } from "react";

export default function ThemeToggle({ className = "" }) {
  const getInitial = () => {
    // Prefer localStorage; fallback to system
    const saved = localStorage.getItem("theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return (
      window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false
    );
  };

  const [isDark, setIsDark] = useState(getInitial);

  // Apply to <html> and persist
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={() => setIsDark((v) => !v)}
      className={[
        "inline-grid h-9 w-9 place-items-center rounded-full transition shadow-sm",
        "bg-neutral-200 text-neutral-900 hover:bg-neutral-300",
        "dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700",
        className,
      ].join(" ")}
    >
      {isDark ? (
        /* Moon */
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
        </svg>
      ) : (
        /* Sun */
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zm9-10v-2h3v2h-3zm-3.24 7.16l1.8 1.79 1.41-1.41-1.79-1.8-1.42 1.42zM12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM12 0h-2v3h2V0z" />
        </svg>
      )}
    </button>
  );
}
