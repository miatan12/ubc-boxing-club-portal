// routes/checkout.js
import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// ---------- Stripe client ----------
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("[payments] STRIPE_SECRET_KEY is missing!");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ---------- Allowed frontends for redirect URL sanitization ----------
const ORIGINS = [
  "http://localhost:3000",
  "https://localhost:3000",
  process.env.FRONTEND_ORIGIN,
  process.env.FRONTEND_STAGING_ORIGIN,
  process.env.FRONTEND_WWW_ORIGIN,
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
  return url.includes("{CHECKOUT_SESSION_ID}")
    ? url
    : `${url}${url.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`;
}

// ---------- Server-trusted pricing and labels ----------
// ADDED: dropin = 1000 cents ($10 CAD)
const PLAN_CENTS = { term: 5155, year: 10310, nonstudent: 8250, dropin: 500 };

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
  // ADDED: flow + label for drop-in
  dropin: {
    dropin: "Drop-in single class",
  },
};

// ---------- Create Checkout Session ----------
router.post("/create-checkout-session", async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res
        .status(500)
        .json({ error: "Server misconfigured: missing STRIPE_SECRET_KEY." });
    }

    // Now accepts "dropin"
    const flow = String(req.body.type || "register").toLowerCase(); // "register" | "renew" | "dropin"
    const planKey = String(req.body.plan || "").toLowerCase(); // "term" | "year" | "nonstudent" | "dropin"

    if (!PLAN_CENTS[planKey]) {
      return res.status(400).json({ error: "Missing or invalid plan." });
    }
    if (!LABELS[flow]) {
      return res.status(400).json({ error: "Invalid flow type." });
    }

    const FRONTEND_ORIGIN =
      process.env.FRONTEND_ORIGIN || "http://localhost:3000";

    const defaultSuccess = `${FRONTEND_ORIGIN}/success`;
    // Cancel page depends on flow (so users land back in the right spot)
    const defaultCancel =
      flow === "renew"
        ? `${FRONTEND_ORIGIN}/renew`
        : flow === "dropin"
        ? `${FRONTEND_ORIGIN}/drop-in`
        : `${FRONTEND_ORIGIN}/register`;

    const success_url = ensureSessionIdParam(
      sanitizeUrl(req.body.successUrl, defaultSuccess)
    );
    const cancel_url = sanitizeUrl(req.body.cancelUrl, defaultCancel);

    const serverLabel = LABELS[flow][planKey];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: { name: `UBC Boxing Club – ${serverLabel}` },
            unit_amount: PLAN_CENTS[planKey],
          },
          quantity: 1,
        },
      ],
      success_url,
      cancel_url,
      metadata: {
        flow, // "register" | "renew" | "dropin"
        plan: planKey, // "term" | "year" | "nonstudent" | "dropin"
        label_client: req.body.label || "",
        label_server: serverLabel,
      },
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return res
      .status(500)
      .json({ error: "Failed to create checkout session." });
  }
});

export default router;
