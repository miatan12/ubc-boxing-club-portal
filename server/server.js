// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import memberRoutes from "./routes/members.js";
import checkoutRoutes from "./routes/checkout.js";
import adminRoutes from "./routes/admin.js";
import stripeWebhook from "./routes/stripe-webhook.js"; // this should export an Express.Router()

dotenv.config();

const app = express();

// ---------------------------- trust proxy ----------------------------
app.set("trust proxy", 1);

// ---------------------------- CORS -----------------------------------
const ORIGINS = [
  "http://localhost:3000",
  "https://localhost:3000",
  process.env.FRONTEND_ORIGIN, // e.g. https://ubcboxingclub.app
].filter(Boolean);

const ALLOWED = new Set(
  ORIGINS.map((o) => {
    try {
      const u = new URL(o);
      return `${u.protocol}//${u.host}`;
    } catch {
      return null;
    }
  }).filter(Boolean)
);

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // non-browser / curl
    try {
      const u = new URL(origin);
      const key = `${u.protocol}//${u.host}`;
      return cb(null, ALLOWED.has(key));
    } catch {
      return cb(null, false);
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};
app.use(cors(corsOptions));
app.options(/^\/api\/.*$/, cors(corsOptions));

// ---------------------------- STRIPE WEBHOOK FIRST -------------------
// IMPORTANT: mount raw body ONLY for the webhook route, BEFORE json/urlencoded.
app.use(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook // expects router with router.post("/webhook", ...)
);

// ---------------------------- body parsing (rest) --------------------
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ---------------------------- health/debug ---------------------------
app.get("/__health", (_req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);
app.get("/__debug/config", (_req, res) =>
  res.json({
    nodeEnv: process.env.NODE_ENV || null,
    hasMongoUri: Boolean(process.env.MONGO_URI),
    hasStripeKey: Boolean(process.env.STRIPE_SECRET_KEY),
    frontendOrigin: process.env.FRONTEND_ORIGIN || null,
    stagingOrigin: process.env.FRONTEND_STAGING_ORIGIN || null,
    wwwOrigin: process.env.FRONTEND_WWW_ORIGIN || null,
  })
);

// ---------------------------- routes ---------------------------------
app.use("/api/checkout", checkoutRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/admin", adminRoutes);

// 404 for unknown API routes
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// Error boundary
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ---------------------------- db + start -----------------------------
(async () => {
  if (!process.env.MONGO_URI) console.error("[server] MONGO_URI is missing!");
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }

  const PORT = process.env.PORT || 5050;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();
