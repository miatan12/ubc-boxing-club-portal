// src/lib/api.js

// CRA reads only REACT_APP_* at build time.
// Do NOT reference import.meta here (it breaks CRA).
const BASE =
  (typeof process !== "undefined" &&
    process.env &&
    (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "")) ||
  "";

// Small helper to build absolute URLs when BASE is set
export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return BASE ? `${BASE}${p}` : p;
}

export async function getJSON(path, init) {
  const res = await fetch(apiUrl(path), {
    credentials: "omit",
    ...(init || {}),
  });
  return res;
}

export async function postJSON(path, body, init) {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
    credentials: "omit",
    ...(init || {}),
  });
  return res;
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

// Optional: see what BASE compiled to
// console.info("[api] BASE =", BASE);
