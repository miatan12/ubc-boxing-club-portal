import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  studentNumber: { type: String, required: true },
  emergencyContactName: { type: String, required: true },
  emergencyContactPhone: { type: String, required: true },
  emergencyContactRelation: { type: String, required: true },
  waiverSigned: { type: Boolean, required: true },
  membershipType: { type: String, enum: ["term", "year"], required: true },
  startDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  paymentMethod: { type: String, enum: ["cash", "online"], required: true },
  cashReceiver: { type: String },

  // ✅ New fields for tracking status and payments
  paymentAmount: { type: Number },
  paymentDate: { type: Date },
  status: { type: String, enum: ["active", "expired", "suspended", "trial"] },
});

export default mongoose.model("Member", memberSchema);
