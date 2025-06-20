import express from "express";
import Member from "../models/Member.js";
import multer from "multer";

const upload = multer();
const router = express.Router();

// ✅ JSON submission (Stripe Success Page)
router.post("/", async (req, res, next) => {
  if (!req.headers["content-type"]?.includes("application/json")) return next();

  console.log("📨 Received JSON member registration request");

  try {
    const {
      name,
      email,
      studentNumber,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      waiverSigned,
      membershipType,
      startDate,
      expiryDate,
      paymentMethod,
      cashReceiver,
    } = req.body;

    console.log("🔍 Incoming data:", req.body);

    // ✅ Validate required fields
    const requiredFields = [
      name,
      email,
      studentNumber,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      membershipType,
      startDate,
      expiryDate,
      paymentMethod,
    ];

    if (requiredFields.some((field) => !field)) {
      console.log("❌ Missing required field(s)");
      return res.status(400).json({ error: "Missing required fields." });
    }

    if (paymentMethod === "cash" && !cashReceiver) {
      console.log("❌ Missing cashReceiver for cash payment");
      return res.status(400).json({
        error: "Please enter the name of the exec who collected cash.",
      });
    }

    // Check for duplicates (same email and startDate)
    const existing = await Member.findOne({ email, startDate });
    if (existing) {
      console.log("⚠️ Duplicate submission detected for:", email, startDate);
      return res.status(409).json({ error: "Member already registered." });
    }

    const now = new Date();
    const isExpired = new Date(expiryDate) < now;
    const status = isExpired ? "expired" : "active";

    const paymentAmount =
      paymentMethod === "online"
        ? membershipType === "year"
          ? 103.1
          : 51.55
        : membershipType === "year"
        ? 100
        : 50;

    const newMember = new Member({
      name,
      email,
      studentNumber,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      waiverSigned,
      membershipType,
      startDate,
      expiryDate,
      paymentMethod,
      cashReceiver,
      paymentAmount,
      paymentDate: now,
      status,
    });

    await newMember.save();

    console.log(`✅ Member created (${paymentMethod}):`, {
      name: newMember.name,
      amount: newMember.paymentAmount,
      status: newMember.status,
    });

    res.status(201).json(newMember);
  } catch (err) {
    console.error("🔥 JSON member creation failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔁 Multipart form submission (cash payment)
router.post("/", upload.none(), async (req, res) => {
  console.log("📨 Received multipart/form-data member registration request");

  try {
    const {
      name,
      email,
      studentNumber,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      waiverSigned,
      membershipType,
      startDate,
      expiryDate,
      paymentMethod,
      cashReceiver,
    } = req.body;

    console.log("🔍 Incoming form data:", req.body);

    const requiredFields = [
      name,
      email,
      studentNumber,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      membershipType,
      startDate,
      expiryDate,
      paymentMethod,
    ];

    if (requiredFields.some((field) => !field)) {
      console.log("❌ Missing required field(s)");
      return res.status(400).json({ error: "Missing required fields." });
    }

    if (paymentMethod === "cash" && !cashReceiver) {
      console.log("❌ Missing cashReceiver for cash payment");
      return res.status(400).json({
        error: "Please enter the name of the exec who collected cash.",
      });
    }

    // Check for duplicates (same email and startDate)
    const existing = await Member.findOne({ email, startDate });
    if (existing) {
      console.log("⚠️ Duplicate submission detected for:", email, startDate);
      return res.status(409).json({ error: "Member already registered." });
    }

    const now = new Date();
    const isExpired = new Date(expiryDate) < now;
    const status = isExpired ? "expired" : "active";

    const paymentAmount =
      paymentMethod === "online"
        ? membershipType === "year"
          ? 103.1
          : 51.55
        : membershipType === "year"
        ? 100
        : 50;

    const newMember = new Member({
      name,
      email,
      studentNumber,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      waiverSigned,
      membershipType,
      startDate,
      expiryDate,
      paymentMethod,
      cashReceiver,
      paymentAmount,
      paymentDate: now,
      status,
    });

    await newMember.save();

    console.log(`✅ Member created (${paymentMethod}):`, {
      name: newMember.name,
      amount: newMember.paymentAmount,
      status: newMember.status,
    });

    res.status(201).json(newMember);
  } catch (err) {
    console.error("🔥 Multipart member creation failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
