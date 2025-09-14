// routes/stripe-webhook.js
import express from "express";
import Stripe from "stripe";
import Member from "../models/Member.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// helper: compute start/expiry on the server (don’t trust client)
function computeDates(plan) {
  const start = new Date(); // now
  const expiry = new Date(start);
  if (plan === "term") expiry.setMonth(expiry.getMonth() + 4);
  if (plan === "year") expiry.setMonth(expiry.getMonth() + 12);
  if (plan === "nonstudent") expiry.setMonth(expiry.getMonth() + 4);
  return { start, expiry };
}

// POST /api/stripe/webhook  (must be raw body; see server.js wiring below)
router.post("/webhook", async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // We’ll carry these from metadata we set when creating the session
    const email = (
      session.customer_email ||
      session.customer_details?.email ||
      session.metadata?.email ||
      ""
    ).toLowerCase();
    const plan = session.metadata?.plan; // "term" | "year" | "nonstudent"
    const flow = session.metadata?.flow; // "register" | "renew"
    const membershipKey = session.metadata?.membershipKey; // our dedupe key

    if (!email || !plan || !membershipKey) {
      console.error("⚠️ Missing metadata on session", session.id, {
        email,
        plan,
        membershipKey,
      });
      return res.json({ received: true }); // don’t 500—Stripe will retry
    }

    const { start, expiry } = computeDates(plan);
    const amount = (session.amount_total ?? 0) / 100;

    // **Idempotent upsert**: one membership per membershipKey
    await Member.updateOne(
      { membershipKey },
      {
        $setOnInsert: {
          // minimally required to create a valid Member
          name: session.metadata?.name || "(Pending Name)",
          email,
          studentNumber: session.metadata?.studentNumber || "(pending)",
          emergencyContactName:
            session.metadata?.emergencyContactName || "(pending)",
          emergencyContactPhone:
            session.metadata?.emergencyContactPhone || "(pending)",
          emergencyContactRelation:
            session.metadata?.emergencyContactRelation || "(pending)",
          waiverSigned: true,
          membershipType: plan,
          startDate: start,
          expiryDate: expiry,
          paymentMethod: "online",
          paymentAmount: amount,
          paymentDate: new Date(),
          status: "active",
          attendance: [],
          membershipKey, // unique
        },
      },
      { upsert: true }
    );

    // (Optional) if you keep a PendingOrders collection, delete it here by membershipKey.
  }

  res.json({ received: true });
});

export default router;
