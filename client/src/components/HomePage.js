import React from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-white">
      {/* subtle background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-16 -translate-x-1/2 h-[460px] w-[460px] rounded-full bg-red-500/15 blur-3xl dark:bg-red-600/30" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-red-700/10 blur-3xl dark:bg-red-900/30" />
      </div>

      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        {/* Brand row */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            to="/"
            aria-label="UBC Boxing Club home"
            className="rounded-full bg-white/80 p-2 ring-1 ring-black/10 shadow-lg dark:bg-black/40 dark:ring-white/10"
          >
            <img
              src="/branding/logo.jpg"
              alt="UBC Boxing Club logo"
              className="h-12 w-12 rounded-full"
            />
          </Link>
          <p className="text-sm tracking-wide text-neutral-600 dark:text-white/60">
            Welcome to
          </p>
        </div>

        {/* Title */}
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-5xl">
          <span className="text-neutral-900 dark:text-white">The </span>
          <span className="bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent dark:from-red-400 dark:to-red-600">
            UBC Boxing Club
          </span>
        </h1>

        {/* Hero card */}
        <section className="relative rounded-3xl bg-gradient-to-b from-red-500 to-red-600 p-8 shadow-[0_10px_40px_-10px_rgba(239,68,68,0.35)] ring-1 ring-black/10 md:p-10 dark:from-red-600 dark:to-red-800 dark:ring-white/10">
          <h2 className="text-3xl font-extrabold leading-tight md:text-4xl text-white drop-shadow">
            Train. Grow.
            <br />
            Compete.
          </h2>

          <p className="mt-4 max-w-2xl text-white/90">
            Join a community of UBC students dedicated to growing stronger,
            together — in and out of the ring.
          </p>

          {/* CTAs */}
          <div className="mt-8 space-y-3">
            {/* Primary: Register */}
            <Link
              to="/register"
              className="group flex w-full items-center justify-center rounded-2xl bg-white py-4 text-lg font-semibold text-neutral-900 shadow-lg transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-4 focus-visible:ring-red-300/50"
            >
              Register
              <svg
                className="ml-2 h-5 w-5 opacity-70 transition group-hover:translate-x-0.5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M13 5l7 7-7 7M5 12h14" />
              </svg>
            </Link>

            {/* Secondary: Drop-in (lighter) */}
            <Link
              to="/drop-in"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              aria-label="Drop-in pass"
            >
              Drop-in
              <svg
                className="h-4 w-4 opacity-70"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 01-2 2v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 002-2V7z" />
              </svg>
            </Link>
          </div>
        </section>

        <p className="mt-10 text-center text-sm text-neutral-700 dark:text-white/70">
          Have questions? Reach us at{" "}
          <a
            className="underline decoration-red-600 underline-offset-4 hover:text-neutral-900 dark:hover:text-white"
            href="mailto:amsboxingubc@gmail.com"
          >
            amsboxingubc@gmail.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
