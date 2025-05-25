import express from "express";
import Member from "../models/Member.js";

const router = express.Router();

router.post("/", async (req, res) => {
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

router.get("/", async (req, res) => {
  try {
    const members = await Member.find();
    res.status(200).json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
