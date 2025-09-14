// src/components/HomePage.js
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
        {/* softer in light mode, stronger in dark */}
        <div className="absolute left-1/2 top-16 -translate-x-1/2 h-[460px] w-[460px] rounded-full bg-red-500/15 blur-3xl dark:bg-red-600/30" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-red-700/10 blur-3xl dark:bg-red-900/30" />
      </div>

      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        {/* Brand row (remove the <Link> if you don’t want the corner logo) */}
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
            Train. Compete.
            <br />
            Grow
          </h2>

          <p className="mt-4 max-w-2xl text-white/90">
            Push your limits, discover your strengths, and be part of a
            community where UBC students grow together, in and out of the ring.
          </p>

          {/* CTAs */}
          <div className="mt-8 space-y-4">
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

            {/* Transparent/outlined button that adapts to theme */}
            <Link
              to="/renew"
              className="group block rounded-2xl ring-1 ring-black/10 transition hover:ring-black/20 dark:ring-white/15 dark:hover:ring-white/25"
            >
              <span className="flex w-full flex-col items-center justify-center rounded-2xl bg-white/60 px-6 py-4 backdrop-blur-sm dark:bg-black/20">
                <span className="flex items-center text-lg font-semibold text-neutral-900 dark:text-white">
                  Renew
                  <svg
                    className="ml-2 h-5 w-5 opacity-70"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 6v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span className="mt-1 text-sm text-neutral-700 dark:text-white/70">
                  Already with us?
                </span>
              </span>
            </Link>
          </div>
        </section>

        <p className="mt-10 text-center text-sm text-neutral-700 dark:text-white/70">
          Reach us at{" "}
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
