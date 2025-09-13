// src/lib/api.js
const viteBase =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) || "";
const craBase =
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) || "";
const BASE = viteBase || craBase || ""; // on Vercel, set one of these to your backend https URL

export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return BASE ? `${BASE}${p}` : p; // if BASE empty, it stays relative (works with a reverse proxy)
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
