import express from "express";
import Member from "../models/Member.js";
import multer from "multer";

const upload = multer();
const router = express.Router();

// POST /api/members — Register new member
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

    // Validate required fields
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

    const newMember = new Member(req.body);
    await newMember.save();

    console.log("✅ New member registered:", newMember.name);
    res.status(201).json(newMember);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/members — Fetch all members
router.get("/", async (req, res) => {
  try {
    const members = await Member.find({});
    res.json(members);
  } catch (err) {
    console.error("Failed to fetch members:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/members/verify — Check membership status
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
