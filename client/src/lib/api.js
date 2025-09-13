// src/lib/api.js
// Decide the API base at build time (Vite or CRA) with a safe runtime fallback.

const fromVite =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.VITE_API_BASE;
const fromCRA =
  typeof process !== "undefined" &&
  process.env &&
  process.env.REACT_APP_API_URL;

// If envs are missing, hard-fallback: when running on your Vercel domain,
// talk to the Render backend directly.
const host = typeof window !== "undefined" ? window.location.hostname : "";
const fallback =
  host && host.endsWith("ubcboxingclub.app")
    ? "https://ubc-boxing-club-portal.onrender.com"
    : "";

// final base (no trailing slash)
export const API_BASE = String(fromVite || fromCRA || fallback).replace(
  /\/+$/,
  ""
);

if (!API_BASE) {
  // You’ll see this if you forgot to set the env on Vercel and you’re not on ubcboxingclub.app
  // It keeps working with relative URLs during local dev behind a proxy.
  console.warn("[api] API_BASE not set — using relative /api");
}

// Helper to build full URL
export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${p}` : p;
}

export async function getJSON(path, init) {
  return fetch(apiUrl(path), { credentials: "omit", ...(init || {}) });
}

export async function postJSON(path, body, init) {
  return fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
    credentials: "omit",
    ...(init || {}),
  });
}

export async function okOrThrow(res, msg = "Request failed") {
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json())?.error || (await res.text()) || "";
    } catch {}
    throw new Error(`${msg} (${res.status})${detail ? `: ${detail}` : ""}`);
  }
  return res;
}

// expose for quick sanity check in DevTools
if (typeof window !== "undefined") window.__API_BASE__ = API_BASE;
