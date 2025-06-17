import express from "express";
import Member from "../models/Member.js";
import multer from "multer";

const upload = multer();
const router = express.Router();

// ✅ JSON submission (Stripe Success Page)
router.post("/", async (req, res, next) => {
  if (!req.headers["content-type"]?.includes("application/json")) return next();

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
      return res.status(400).json({ error: "Missing required fields." });
    }

    if (paymentMethod === "cash" && !cashReceiver) {
      return res.status(400).json({
        error: "Please enter the name of the exec who collected cash.",
      });
    }

    // ✅ Add extra metadata
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
router.post("/", upload.single("screenshot"), async (req, res) => {
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
      return res.status(400).json({ error: "Missing required fields." });
    }

    if (paymentMethod === "cash" && !cashReceiver) {
      return res.status(400).json({
        error: "Please enter the name of the exec who collected cash.",
      });
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

// Membership Renewal
router.post("/renew", async (req, res) => {
  const { email, paymentMethod, paymentAmount, newExpiryDate } = req.body;

  try {
    const member = await Member.findOne({ email });

    if (!member) return res.status(404).json({ message: "Member not found" });

    member.paymentMethod = paymentMethod;
    member.paymentAmount = paymentAmount;
    member.paymentDate = new Date();
    member.expiryDate = newExpiryDate;
    member.status = "active";

    await member.save();

    res.json({ message: "Membership renewed!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🧾 GET all members
router.get("/", async (req, res) => {
  try {
    const members = await Member.find({});
    res.json(members);
  } catch (err) {
    console.error("Failed to fetch members:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ GET /api/members/verify
router.get("/verify", async (req, res) => {
  const { name } = req.query;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required." });
  }

  try {
    const member = await Member.findOne({
      $or: [{ name: new RegExp(name, "i") }, { email: new RegExp(name, "i") }],
    });

    if (!member) {
      return res.json({ found: false });
    }

    const isActive = new Date(member.expiryDate) >= new Date();

    return res.json({
      found: true,
      active: isActive,
      name: member.name,
      expiryDate: member.expiryDate,
    });
  } catch (err) {
    console.error("🔥 Verify route error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

export default router;
