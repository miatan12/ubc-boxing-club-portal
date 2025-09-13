// routes/payments.js
import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// ---------- Stripe client ----------
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("[payments] STRIPE_SECRET_KEY is missing!");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // apiVersion: "2024-06-20", // optionally pin a version you use
});

// ---------- Allowed frontends for redirect URL sanitization ----------
const ORIGINS = [
  "http://localhost:3000",
  "https://localhost:3000",
  process.env.FRONTEND_ORIGIN, // e.g. https://ubcboxingclub.app
  process.env.FRONTEND_STAGING_ORIGIN, // e.g. https://staging.ubcboxingclub.app
  process.env.FRONTEND_WWW_ORIGIN, // e.g. https://www.ubcboxingclub.app
].filter(Boolean);

const ALLOWED_ORIGINS = new Set(
  ORIGINS.map((o) => {
    try {
      const u = new URL(o);
      return `${u.protocol}//${u.host}`;
    } catch {
      return null;
    }
  }).filter(Boolean)
);

// ---------- Helpers ----------
function sanitizeUrl(url, fallback) {
  try {
    if (!url) return fallback;
    const u = new URL(url);
    const origin = `${u.protocol}//${u.host}`;
    return ALLOWED_ORIGINS.has(origin) ? url : fallback;
  } catch {
    return fallback;
  }
}

function ensureSessionIdParam(url) {
  // Stripe expands {CHECKOUT_SESSION_ID} on redirect
  return url.includes("{CHECKOUT_SESSION_ID}")
    ? url
    : `${url}${url.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`;
}

// ---------- Server-trusted pricing and labels ----------
const PLAN_CENTS = { term: 5155, year: 10310, nonstudent: 8250 };
const LABELS = {
  register: {
    term: "Student — 1 Term (4 months)",
    year: "Student — 3 Terms (12 months)",
    nonstudent: "Non-Student — 4 months",
  },
  renew: {
    term: "Renewal — Student — 1 Term (4 months)",
    year: "Renewal — Student — 3 Terms (12 months)",
    nonstudent: "Renewal — Non-Student — 4 months",
  },
};

// ---------- Preflight (helpful if global app.options isn't set) ----------
router.options("/create-checkout-session", (_req, res) => res.sendStatus(204));

// ---------- Create Checkout Session ----------
router.post("/create-checkout-session", async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res
        .status(500)
        .json({ error: "Server misconfigured: missing STRIPE_SECRET_KEY." });
    }

    const flow = String(req.body.type || "register").toLowerCase(); // "register" | "renew"
    const planKey = String(req.body.plan || "").toLowerCase(); // "term" | "year" | "nonstudent"

    if (!PLAN_CENTS[planKey]) {
      return res.status(400).json({ error: "Missing or invalid plan." });
    }
    if (!LABELS[flow]) {
      return res.status(400).json({ error: "Invalid flow type." });
    }

    // Defaults based on configured frontend
    const FRONTEND_ORIGIN =
      process.env.FRONTEND_ORIGIN || "http://localhost:3000";

    const defaultSuccess = `${FRONTEND_ORIGIN}/success`;
    const defaultCancel =
      flow === "renew"
        ? `${FRONTEND_ORIGIN}/renew`
        : `${FRONTEND_ORIGIN}/register`;

    // Sanitize incoming URLs; success must include session_id placeholder
    const success_url = ensureSessionIdParam(
      sanitizeUrl(req.body.successUrl, defaultSuccess)
    );
    const cancel_url = sanitizeUrl(req.body.cancelUrl, defaultCancel);

    // Use server-side label and price
    const serverLabel = LABELS[flow][planKey];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: { name: `UBC Boxing Club – ${serverLabel}` },
            unit_amount: PLAN_CENTS[planKey], // enforce server-side price
          },
          quantity: 1,
        },
      ],
      success_url,
      cancel_url,
      metadata: {
        flow, // "register" | "renew"
        plan: planKey, // "term" | "year" | "nonstudent"
        label_client: req.body.label || "", // optional: client-shown label
        label_server: serverLabel, // authoritative label used
      },
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Stripe error:", err);
    return res
      .status(500)
      .json({ error: "Failed to create checkout session." });
  }
});

export default router;
