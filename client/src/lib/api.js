// src/lib/api.js
// TEMP LOCAL HARDCODE: use backend on 5050 when on localhost.

const host = typeof window !== "undefined" ? window.location.hostname : "";

// TEMP: hardcode local dev backend
const LOCAL_DEV_API = "http://localhost:5050";

const fromVite =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.VITE_API_BASE;

const fromCRA =
  typeof process !== "undefined" &&
  process.env &&
  process.env.REACT_APP_API_URL;

// Production fallback (Render) only when on your domain
const fallback =
  host && host.endsWith("ubcboxingclub.app")
    ? "https://ubc-boxing-club-portal.onrender.com"
    : "";

// final base (no trailing slash)
export const API_BASE = String(
  host === "localhost" || host === "127.0.0.1"
    ? LOCAL_DEV_API
    : fromVite || fromCRA || fallback,
).replace(/\/+$/, "");

if (!API_BASE) {
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
