// src/components/Info.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Info() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#0a0b0d] text-neutral-900 dark:text-white pb-24">
      <div className="mx-auto max-w-xl px-5 pt-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Club Info</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Everything you need to get started with the UBC Boxing Club.
        </p>

        {/* At a glance */}
        <section className="mt-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-6 shadow-sm">
          <h2 className="text-lg font-semibold">At a glance</h2>
          <ul className="mt-2 text-sm space-y-1">
            <li>• Beginner & intermediate classes each week</li>
            <li>• Drop-in available for non-members</li>
            <li>• Gloves available to borrow; hand wraps recommended</li>
          </ul>
        </section>

        {/* Location */}
        <section className="mt-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Location</h2>
          <p className="mt-1 text-sm">
            Most sessions run in the{" "}
            <span className="font-medium">AMS Student Nest</span>. Exact room &
            time are posted each week on our Instagram.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="https://maps.google.com/?q=AMS+Student+Nest,+UBC"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-xl px-3 py-2 text-sm ring-1 ring-black/10 hover:bg-neutral-100 dark:ring-white/10 dark:hover:bg-neutral-800"
            >
              Open in Maps
              <ExternalIcon className="ml-2 h-4 w-4" />
            </a>
            <a
              href="https://www.instagram.com/ubcboxingclub/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-xl px-3 py-2 text-sm ring-1 ring-black/10 hover:bg-neutral-100 dark:ring-white/10 dark:hover:bg-neutral-800"
            >
              Weekly updates on Instagram
              <ExternalIcon className="ml-2 h-4 w-4" />
            </a>
          </div>
        </section>

        {/* Schedule */}
        <section className="mt-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Schedule</h2>
          <p className="mt-1 text-sm">
            Typical pattern (subject to change by term):
          </p>
          <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
            <li>Beginner: Mon & Wed, 6:00–7:00 PM</li>
            <li>Intermediate/Advanced: Tue & Thu, 6:00–7:30 PM</li>
            <li>Open training: Fri, 5:00–7:00 PM</li>
          </ul>
          <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
            Confirm weekly times/rooms on Instagram stories.
          </p>
        </section>

        {/* Pricing */}
        <section className="mt-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Pricing</h2>
          <ul className="mt-2 text-sm space-y-1">
            <li>
              <span className="font-medium">Students:</span> $50 / term • $100 /
              year
            </li>
            <li>
              <span className="font-medium">Non-students:</span> $80 / term
            </li>
            <li>
              <span className="font-medium">Drop-in:</span> $10 per class
            </li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/register"
              className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Register
            </Link>
            <Link
              to="/drop-in"
              className="rounded-2xl px-4 py-2 text-sm font-semibold ring-1 ring-black/10 hover:bg-neutral-100 dark:ring-white/10 dark:hover:bg-neutral-800"
            >
              Drop-in options
            </Link>
          </div>
        </section>

        {/* Contact & Links */}
        <section className="mt-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Contact & links</h2>
          <ul className="mt-2 text-sm space-y-2">
            <li>
              Email:{" "}
              <a
                href="mailto:amsboxingubc@gmail.com"
                className="underline text-red-600 dark:text-red-400"
              >
                amsboxingubc@gmail.com
              </a>
            </li>
            <li>
              Instagram:{" "}
              <a
                href="https://www.instagram.com/ubcboxingclub/"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                @ubcboxingclub
              </a>
            </li>
            <li>
              Facebook:{" "}
              <a
                href="https://www.facebook.com/UBCBoxingClub/"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                UBC Boxing Club
              </a>
            </li>
            <li>
              AMS club page:{" "}
              <a
                href="https://amsclubs.ca/boxing-club/"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                amsclubs.ca/boxing-club
              </a>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}

/* tiny external-link icon */
function ExternalIcon({ className = "" }) {
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
      <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </svg>
  );
}
