// routes/stripe-webhook.js
import express from "express";
import Stripe from "stripe";
import Member from "../models/Member.js";
import { sendEmail } from "../lib/email.js";
import { renderReceiptEmail } from "../lib/receipt.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// compute validity
function computeDates(plan) {
  const start = new Date();
  const expiry = new Date(start);
  if (plan === "term" || plan === "nonstudent") expiry.setMonth(expiry.getMonth() + 4);
  if (plan === "year") expiry.setMonth(expiry.getMonth() + 12);
  return { start, expiry };
}

router.post("/webhook", async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook verify failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const email =
        (session.customer_details?.email ||
          session.customer_email ||
          session.metadata?.email ||
          "")
          .toLowerCase();
      const name = session.metadata?.name || session.customer_details?.name || "";
      const plan = session.metadata?.plan;           // 'term' | 'year' | 'nonstudent' | 'dropin'
      const flow = session.metadata?.flow;           // 'register' | 'renew' | 'dropin'
      const amountPaid = (session.amount_total ?? 0) / 100;
      const reference = session.payment_intent || session.id;

      if (!email || !plan || !flow) {
        console.warn("Missing email/plan/flow on session", session.id);
        return res.json({ received: true });
      }

      // --- Update DB (register/renew) ---
      let validFrom = null, validUntil = null, checkInDate = null;

      if (flow === "dropin") {
        // If you track drop-ins in DB, add an attendance record here:
        // await Member.updateOne({ email }, { $push: { attendance: new Date() }});
        checkInDate = new Date().toISOString();
      } else {
        const { start, expiry } = computeDates(plan);
        validFrom = start.toISOString();
        validUntil = expiry.toISOString();

        await Member.updateOne(
          { email }, // or a different lookup key you prefer
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
          { upsert: true }
        );
      }

      // --- Send receipt email ---
      const { subject, html, text } = renderReceiptEmail({
        action: flow,
        memberName: name,
        email,
        amount: amountPaid,
        membershipType: plan,
        validFrom,
        validUntil,
        checkInDate,
        paymentType: "Online",
        reference,
      });

      await sendEmail({ to: email, subject, html, text });
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    // still 200 so Stripe doesn’t spam retries if the DB write succeeded
    res.json({ received: true });
  }
});

export default router;
