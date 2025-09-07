import express from "express";
import Member from "../models/Member.js";
import multer from "multer";

const upload = multer();
const router = express.Router();

/* ----------------------------- helpers ----------------------------- */

const VALID_TYPES = new Set(["term", "year", "nonstudent"]);
const VALID_PAY = new Set(["cash", "online"]);

// map any legacy / variant strings -> canonical values
const TYPE_MAP = {
  term: "term",
  semester: "term",
  sem: "term",
  "4m": "term",
  "4-month": "term",
  "4 months": "term",
  year: "year",
  annual: "year",
  "12m": "year",
  "12-month": "year",
  nonstudent: "nonstudent",
  "non-student": "nonstudent",
};

function normalizeType(value) {
  if (!value) return undefined;
  const key = String(value).trim().toLowerCase();
  return TYPE_MAP[key] || (VALID_TYPES.has(key) ? key : undefined);
}

function computePaymentAmount(membershipType, paymentMethod) {
  // dollars
  if (paymentMethod === "online") {
    if (membershipType === "term") return 51.55;
    if (membershipType === "year") return 103.1;
    if (membershipType === "nonstudent") return 82.5;
  } else {
    if (membershipType === "term") return 50;
    if (membershipType === "year") return 100;
    if (membershipType === "nonstudent") return 80;
  }
  return 0;
}

function deriveStatus(expiryDate) {
  return new Date(expiryDate) < new Date() ? "expired" : "active";
}

function normalizeBody(body) {
  const b = { ...body };
  if (typeof b.email === "string") {
    b.email = b.email.trim().toLowerCase();
  }
  if (typeof b.membershipType === "string") {
    const t = normalizeType(b.membershipType);
    if (t) b.membershipType = t;
  }
  return b;
}

/* ---------------------- JSON submission (Stripe) -------------------- */

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
    } = normalizeBody(req.body);

    const required = [
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
    if (required.some((v) => !v))
      return res.status(400).json({ error: "Missing required fields." });

    if (!VALID_TYPES.has(membershipType))
      return res.status(400).json({ error: "Invalid membership type." });

    if (!VALID_PAY.has(paymentMethod))
      return res.status(400).json({ error: "Invalid payment method." });

    if (paymentMethod === "cash" && !cashReceiver)
      return res
        .status(400)
        .json({
          error: "Please enter the name of the exec who collected cash.",
        });

    const paymentAmount = computePaymentAmount(membershipType, paymentMethod);
    const now = new Date();

    const newMember = new Member({
      name,
      email,
      studentNumber,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      waiverSigned,
      membershipType,
      startDate: new Date(startDate),
      expiryDate: new Date(expiryDate),
      paymentMethod,
      cashReceiver,
      paymentAmount,
      paymentDate: now,
      status: deriveStatus(expiryDate),
    });

    await newMember.save();
    res.status(201).json(newMember);
  } catch (err) {
    console.error("🔥 JSON member creation failed:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

/* ------------ Multipart submission (cash at the desk) --------------- */

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
    } = normalizeBody(req.body);

    const required = [
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
    if (required.some((v) => !v))
      return res.status(400).json({ error: "Missing required fields." });

    if (!VALID_TYPES.has(membershipType))
      return res.status(400).json({ error: "Invalid membership type." });

    if (!VALID_PAY.has(paymentMethod))
      return res.status(400).json({ error: "Invalid payment method." });

    if (paymentMethod === "cash" && !cashReceiver)
      return res
        .status(400)
        .json({
          error: "Please enter the name of the exec who collected cash.",
        });

    const paymentAmount = computePaymentAmount(membershipType, paymentMethod);
    const now = new Date();

    const newMember = new Member({
      name,
      email,
      studentNumber,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      waiverSigned,
      membershipType,
      startDate: new Date(startDate),
      expiryDate: new Date(expiryDate),
      paymentMethod,
      cashReceiver,
      paymentAmount,
      paymentDate: now,
      status: deriveStatus(expiryDate),
    });

    await newMember.save();
    res.status(201).json(newMember);
  } catch (err) {
    console.error("🔥 Multipart member creation failed:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

/* ---------------- verify (exists + active/expired) ------------------ */

router.get("/verify", async (req, res) => {
  const email = (req.query.name || "").toString().trim().toLowerCase();
  try {
    const member = await Member.findOne({ email });
    if (!member) return res.json({ found: false });

    const active =
      member.expiryDate && new Date(member.expiryDate) > new Date();
    res.json({ found: true, active });
  } catch (err) {
    console.error("❌ Verify error:", err);
    res.status(500).json({ found: false, error: "Server error" });
  }
});

/* --------------------------- renewal ------------------------------- */

router.post("/renew", async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const paymentMethod = req.body.paymentMethod;
    const paymentAmount = Number(req.body.paymentAmount);
    const expiry = new Date(req.body.newExpiryDate);

    const member = await Member.findOne({ email });
    if (!member) return res.status(404).json({ message: "Member not found" });

    if (!VALID_PAY.has(paymentMethod))
      return res.status(400).json({ message: "Invalid payment method." });

    if (Number.isNaN(expiry.getTime()))
      return res.status(400).json({ message: "Invalid expiry date." });

    // normalize any legacy type on existing documents
    const normalized = normalizeType(member.membershipType);
    member.membershipType = normalized || "term";

    member.paymentMethod = paymentMethod;
    member.paymentAmount = paymentAmount; // dollars
    member.paymentDate = new Date();
    member.expiryDate = expiry;
    member.status = "active";

    await member.save();
    res.json({ message: "Membership renewed!" });
  } catch (err) {
    console.error("❌ Renew error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------- attendance + list + search ----------------- */

router.post("/checkin", async (req, res) => {
  const { emailOrName } = req.body;
  if (!emailOrName || !emailOrName.trim()) {
    return res.status(400).json({ error: "Email or name is required." });
  }
  try {
    const term = emailOrName.trim();
    const member = await Member.findOne({
      $or: [
        { email: new RegExp(`^${term}$`, "i") },
        { name: new RegExp(term, "i") },
      ],
    });
    if (!member) return res.status(404).json({ error: "Member not found." });

    member.attendance.push(new Date());
    await member.save();

    res.json({
      message: "Check-in recorded.",
      name: member.name,
      totalClasses: member.attendance.length,
    });
  } catch (err) {
    console.error("❌ Check-in error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

router.get("/", async (_req, res) => {
  try {
    const members = await Member.find({});
    res.json(members);
  } catch (err) {
    console.error("Failed to fetch members:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/search", async (req, res) => {
  const { query } = req.query;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: "Query is required." });
  }
  try {
    const regex = new RegExp(query.trim(), "i");
    const members = await Member.find({
      $or: [{ name: regex }, { email: regex }],
    });
    const result = members.map((m) => ({
      name: m.name,
      email: m.email,
      paymentAmount: m.paymentAmount,
      expiryDate: m.expiryDate,
      status: new Date(m.expiryDate) >= new Date() ? "active" : "expired",
    }));
    res.json(result);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

export default router;
