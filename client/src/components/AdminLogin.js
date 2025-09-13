// src/components/AdminLogin.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// ✅ use your helper consistently
import { postJSON, okOrThrow } from "../lib/api";

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

function LockIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If already logged in this session, bounce to /admin
  useEffect(() => {
    if (sessionStorage.getItem("isAdmin") === "true") {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // ✅ await and check .ok, then parse JSON
      const res = await postJSON("/api/admin/login", { password });
      await okOrThrow(res, "Login failed");
      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem("isAdmin", "true");
        localStorage.removeItem("isAdmin");
        navigate("/admin", { replace: true });
      } else {
        setError("Incorrect password.");
      }
    } catch (e) {
      setError("Incorrect password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0b0d] text-neutral-900 dark:text-white pb-24">
      <div className="mx-auto max-w-md px-5 pt-6">
        <button
          onClick={() => navigate("/", { replace: true })}
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mt-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600 text-white grid place-items-center">
              <LockIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold">Admin Login</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Enter the admin password to continue.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <label className="block mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Password
            </label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                placeholder="Enter admin password"
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !loading && handleLogin()
                }
                autoFocus
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:underline"
                tabIndex={-1}
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>

            {error && (
              <p
                className="mt-2 text-sm text-red-600 dark:text-red-400"
                role="alert"
                aria-live="polite"
              >
                {error}
              </p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className={[
                "mt-5 w-full rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                loading
                  ? "bg-red-400 text-white cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700",
              ].join(" ")}
            >
              {loading ? "Signing in…" : "Login"}
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
          Session ends when you close this tab or click Logout.
        </p>
      </div>
    </div>
  );
}
