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
  startDate: { type: String, required: true },
  expiryDate: { type: String, required: true },
  paymentMethod: { type: String, enum: ["online", "cash"], required: true },
  cashReceiver: { type: String }, // Optional unless paymentMethod is "cash"
});

const Member = mongoose.model("Member", memberSchema);

export default Member;
