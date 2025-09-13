// src/lib/api.js

// CRA uses process.env.REACT_APP_*
const craBase =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_URL) ||
  "";

// BASE will be your Render backend in production
const BASE = craBase; // keep it simple for CRA

export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return BASE ? `${BASE}${p}` : p; // if BASE empty (local proxy), keep relative
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
