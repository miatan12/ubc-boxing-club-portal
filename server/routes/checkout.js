import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// -------------------------------------------------------------
// Allowed frontend origins (production, staging, localhost)
// -------------------------------------------------------------
const ALLOWED_ORIGINS = new Set(
  [
    "http://localhost:3000",
    process.env.FRONTEND_ORIGIN, // e.g. https://boxing.ubc.ca
    process.env.FRONTEND_STAGING_ORIGIN, // e.g. https://staging.boxing.ubc.ca
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

// -------------------------------------------------------------
// Pricing map (server-trusted values in cents)
// -------------------------------------------------------------
const PLAN_CENTS = {
  term: 5155, // Student – 1 Term (4 months)
  year: 10310, // Student – 3 Terms (12 months)
  nonstudent: 8250, // Non-Student – 12 months
};

// -------------------------------------------------------------
// Create Checkout Session
// -------------------------------------------------------------
router.post("/create-checkout-session", async (req, res) => {
  const { plan, label, successUrl, cancelUrl, type } = req.body;

  if (!PLAN_CENTS[plan] || !label) {
    return res.status(400).json({ error: "Missing or invalid plan/label." });
  }

  // Default fallback URLs
  const FRONTEND_ORIGIN =
    process.env.FRONTEND_ORIGIN || "http://localhost:3000";
  const defaultSuccess = `${FRONTEND_ORIGIN}/success`;
  const defaultCancel = `${FRONTEND_ORIGIN}/register`;

  // Sanitize URLs from client
  const success_url = sanitizeUrl(successUrl, defaultSuccess);
  const cancel_url = sanitizeUrl(cancelUrl, defaultCancel);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: { name: `UBC Boxing Club – ${label}` },
            unit_amount: PLAN_CENTS[plan], // enforce server-side pricing
          },
          quantity: 1,
        },
      ],
      success_url,
      cancel_url,
      metadata: {
        flow: type || "register", // "renew" | "register"
        plan, // "term" | "year" | "nonstudent"
        label,
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Stripe error:", err);
    res.status(500).json({ error: "Failed to create checkout session." });
  }
});

export default router;
