import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  emergencyContact: String,
  waiverSigned: Boolean,
  membershipType: String,
  startDate: Date,
  expiryDate: Date,
});

export default mongoose.model("Member", memberSchema);
