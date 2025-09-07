// src/components/HomePage.js
import React, { useState } from "react";
import { Link } from "react-router-dom";

/* Page-local brand logo (with glow + fallback) */
function BrandLogo({ src = "/branding/logo.jpg", alt = "UBC Boxing Club" }) {
  const [failed, setFailed] = useState(false);

  return (
    <Link
      to="/"
      aria-label="UBC Boxing Club home"
      className="group relative inline-block"
    >
      {/* soft glow */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-0.5 rounded-full
                   bg-[conic-gradient(at_50%_50%,#ef4444_0deg,#991b1b_120deg,#ef4444_240deg,#991b1b_360deg)]
                   opacity-70 blur-[3px] transition group-hover:opacity-100 dark:opacity-90"
      />
      {/* ring frame */}
      <span className="relative block rounded-full p-[3px] bg-white/80 dark:bg-black/80">
        <span className="block rounded-full bg-black p-0.5 ring-2 ring-red-500">
          {failed ? (
            <span className="grid h-12 w-12 place-items-center rounded-full bg-red-600 text-white font-extrabold leading-none tracking-wide">
              UBC
            </span>
          ) : (
            <img
              src={src}
              alt={alt}
              className="h-12 w-12 rounded-full object-cover"
              loading="eager"
              decoding="async"
              fetchpriority="high"
              onError={() => setFailed(true)}
            />
          )}
        </span>
      </span>
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0b0d] text-black dark:text-white pb-24">
      {/* Top row: page-local logo (not persistent) */}
      <div className="mx-auto max-w-md px-5 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo />
          <span className="hidden sm:inline text-sm font-semibold text-neutral-900 dark:text-white">
            UBC Boxing Club
          </span>
        </div>
        {/* (no toggle here — the global one in AppShell persists) */}
        <span className="sr-only">Theme toggle is in the top-right</span>
      </div>

      {/* Title */}
      <div className="mx-auto max-w-md px-5 pt-2 text-center">
        <div className="text-sm text-neutral-600 dark:text-neutral-300">
          Welcome to
        </div>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          The UBC Boxing Club
        </h1>
      </div>

      {/* Hero card */}
      <div className="mx-auto max-w-md px-5 pt-5">
        <div className="relative overflow-hidden rounded-3xl shadow-lg bg-gradient-to-b from-red-500 to-red-600 dark:from-[#c12] dark:to-[#8b111c]">
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/35" />
          <div className="relative px-6 py-7 sm:px-8 sm:py-9 text-white">
            <h2 className="text-2xl sm:text-3xl font-extrabold drop-shadow">
              <span className="block">Train. Compete.</span>
              <span className="block">Community.</span>
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-white/90 max-w-sm">
              Join our boxing community and reach your fitness goals, learn new
              technique, and more!
            </p>

            {/* CTAs */}
            <div className="mt-6 space-y-3">
              <Link
                to="/register"
                className="block w-full rounded-2xl bg-white text-neutral-900 text-center font-semibold py-3 hover:bg-neutral-100 transition"
              >
                Register
              </Link>

              <Link
                to="/renew"
                className="block w-full rounded-2xl bg-white/10 text-white text-center font-semibold py-3 ring-1 ring-white/55 hover:bg-white/15 transition"
              >
                Renew
                <div className="mt-1 text-center text-xs text-white/80">
                  Already with us?
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Contact footer */}
      <div className="mx-auto max-w-md px-5">
        <p className="mt-8 text-center text-sm text-neutral-600 dark:text-neutral-300">
          Reach us{" "}
          <a
            className="text-red-600 dark:text-red-400 underline underline-offset-4"
            href="mailto:amsboxingubc@gmail.com"
          >
            amsboxingubc@gmail.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
