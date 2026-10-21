import mongoose from "mongoose";

// Keep unpaid registrations out of the members collection. The checkout ID
// also becomes the new member's ID, making webhook retries safe atomically.
const checkoutSchema = new mongoose.Schema({
  flow: { type: String, enum: ["register", "renew", "dropin"], required: true },
  plan: { type: String, required: true },
  registration: mongoose.Schema.Types.Mixed,
  memberId: mongoose.Schema.Types.ObjectId,
  sessionId: { type: String, unique: true, sparse: true },
  fulfilledAt: Date,
  receiptSentAt: Date,
}, { timestamps: true });

export default mongoose.model("Checkout", checkoutSchema);
