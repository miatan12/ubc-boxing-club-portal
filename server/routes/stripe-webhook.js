import express from "express";
import Stripe from "stripe";
import Member from "../models/Member.js";
import { sendEmail } from "../lib/email.js";
import { renderReceiptEmail } from "../lib/receipt.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ------------------ helpers ------------------
function computeDates(plan) {
  const start = new Date();
  const expiry = new Date(start);

  if (plan === "term" || plan === "nonstudent") {
    expiry.setMonth(expiry.getMonth() + 4);
  }
  if (plan === "year") {
    expiry.setMonth(expiry.getMonth() + 12);
  }

  return { start, expiry };
}

// ------------------ webhook ------------------
router.post("/webhook", async (req, res) => {
  console.log("[webhook] HIT");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("[webhook] EVENT:", event.type);

  // We only care about completed Checkout sessions
  if (event.type !== "checkout.session.completed") {
    return res.json({ received: true });
  }

  try {
    const session = event.data.object;

    // ------------------ receipt URL ------------------
    let receiptUrl = null;
    try {
      if (session.payment_intent) {
        const pi = await stripe.paymentIntents.retrieve(
          session.payment_intent,
          { expand: ["latest_charge"] },
        );
        receiptUrl = pi?.latest_charge?.receipt_url || null;
      }
    } catch (err) {
      console.warn("[webhook] Could not fetch receipt URL:", err.message);
    }

    // ------------------ extract metadata ------------------
    const email = (
      session.customer_details?.email ||
      session.customer_email ||
      session.metadata?.email ||
      ""
    ).toLowerCase();

    const name = session.metadata?.name || session.customer_details?.name || "";

    const plan = session.metadata?.plan; // term | year | nonstudent | dropin
    const flow = session.metadata?.flow; // register | renew | dropin
    const amountPaid = (session.amount_total ?? 0) / 100;
    const reference = session.payment_intent || session.id;

    console.log("[webhook] COMPLETED:", {
      email,
      flow,
      plan,
      amountPaid,
      receiptUrl: Boolean(receiptUrl),
    });

    if (!email || !plan || !flow) {
      console.warn("[webhook] Missing required data", {
        email,
        plan,
        flow,
      });
      return res.json({ received: true });
    }

    // ------------------ DB updates ------------------
    let validFrom = null;
    let validUntil = null;
    let checkInDate = null;

    if (flow === "dropin") {
      // Drop-ins are NOT stored in DB
      checkInDate = new Date().toISOString();
    } else {
      const { start, expiry } = computeDates(plan);
      validFrom = start.toISOString();
      validUntil = expiry.toISOString();

      await Member.updateOne(
        { email },
        {
          $set: {
            name: name || "(Pending Name)",
            membershipType: plan,
            startDate: start,
            expiryDate: expiry,
            paymentMethod: "online",
            paymentAmount: amountPaid,
            paymentDate: new Date(),
            status: "active",
          },
          $setOnInsert: { attendance: [] },
        },
        { upsert: true },
      );
    }

    // ------------------ email ------------------
    const { subject, html, text } = renderReceiptEmail({
      action: flow, // register | renew | dropin
      memberName: name,
      email,
      amount: amountPaid,
      membershipType: plan,
      validFrom,
      validUntil,
      checkInDate,
      paymentType: "Online",
      reference,
      receiptUrl,
    });

    await sendEmail({ to: email, subject, html, text });

    console.log("[webhook] Email sent to", email);
    return res.json({ received: true });
  } catch (err) {
    console.error("[webhook] Handler error:", err);
    // Always return 200 so Stripe doesn’t retry forever
    return res.json({ received: true });
  }
});

export default router;
