import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const ALLOWED_ORIGINS = new Set(
  [
    "http://localhost:3000",
    "https://localhost:3000",
    process.env.FRONTEND_ORIGIN,
    process.env.FRONTEND_STAGING_ORIGIN,
  ].filter(Boolean)
);

function sanitizeUrl(url, fallback) {
  try {
    if (!url) return fallback;
    const u = new URL(url);
    return ALLOWED_ORIGINS.has(`${u.protocol}//${u.host}`) ? url : fallback;
  } catch {
    return fallback;
  }
}

function ensureSessionIdParam(url) {
  return url.includes("{CHECKOUT_SESSION_ID}")
    ? url
    : `${url}${url.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`;
}

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

router.post("/create-checkout-session", async (req, res) => {
  try {
    const flow = String(req.body.type || "register").toLowerCase();
    const planKey = String(req.body.plan || "").toLowerCase(); // normalize

    if (!PLAN_CENTS[planKey])
      return res.status(400).json({ error: "Missing or invalid plan." });
    if (!LABELS[flow])
      return res.status(400).json({ error: "Invalid flow type." });

    const FRONTEND_ORIGIN =
      process.env.FRONTEND_ORIGIN || "http://localhost:3000";
    const defaultSuccess =
      flow === "renew"
        ? `${FRONTEND_ORIGIN}/renew-success`
        : `${FRONTEND_ORIGIN}/success`;
    const defaultCancel =
      flow === "renew"
        ? `${FRONTEND_ORIGIN}/renew`
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
        flow,
        plan: planKey,
        label_client: req.body.label || "",
        label_server: serverLabel,
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Stripe error:", err);
    res.status(500).json({ error: "Failed to create checkout session." });
  }
});

export default router;
