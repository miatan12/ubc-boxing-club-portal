import express from "express";
import Stripe from "stripe";
import Member from "../models/Member.js";
import Checkout from "../models/Checkout.js";
import { fulfillCheckout } from "../lib/fulfill-checkout.js";
import { sendEmail } from "../lib/email.js";
import { renderReceiptEmail } from "../lib/receipt.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
    const { checkout, start, expiry } = await fulfillCheckout(session, { Checkout, Member });
    if (checkout.receiptSentAt) return res.json({ received: true });

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

    const validFrom = flow === "dropin" ? null : start.toISOString();
    const validUntil = flow === "dropin" ? null : expiry.toISOString();
    const checkInDate = flow === "dropin" ? start.toISOString() : null;

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

    await sendEmail({ to: email, subject, html, text }, {
      idempotencyKey: `checkout-receipt/${session.id}`,
    });
    await Checkout.updateOne(
      { _id: checkout._id },
      { $set: { receiptSentAt: new Date() } },
    );

    console.log("[webhook] Email sent to", email);
    return res.json({ received: true });
  } catch (err) {
    console.error("[webhook] Handler error:", err);
    // Retry transient database/email failures without duplicating membership.
    return res.status(500).json({ error: "Could not fulfill checkout." });
  }
});

export default router;
