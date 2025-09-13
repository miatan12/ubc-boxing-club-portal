// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import memberRoutes from "./routes/members.js";
import checkoutRoutes from "./routes/checkout.js"; // exposes POST /create-checkout-session
import adminRoutes from "./routes/admin.js";

dotenv.config();

const app = express();

// ---------------------------- trust proxy ----------------------------
app.set("trust proxy", 1);

// ---------------------------- body parsing ---------------------------
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ---------------------------- CORS -----------------------------------
const ORIGINS = [
  "http://localhost:3000",
  "https://localhost:3000",
  process.env.FRONTEND_ORIGIN, // e.g. https://ubcboxingclub.app
  process.env.FRONTEND_STAGING_ORIGIN, // e.g. https://staging.ubcboxingclub.app
  process.env.FRONTEND_WWW_ORIGIN, // e.g. https://www.ubcboxingclub.app
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
    // allow server-to-server, curl, same-origin SSR (no Origin header)
    if (!origin) return cb(null, true);
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
app.options("*", cors(corsOptions));

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
app.use("/api/checkout", checkoutRoutes); // -> POST /api/checkout/create-checkout-session
app.use("/api/members", memberRoutes);
app.use("/api/admin", adminRoutes);

// 404 for unknown API routes (helps avoid HTML responses)
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// Error boundary (return JSON, not HTML)
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ---------------------------- db + start -----------------------------
(async () => {
  if (!process.env.MONGO_URI) {
    console.error("[server] MONGO_URI is missing!");
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    // If you prefer to crash on boot failure:
    // process.exit(1);
  }

  const PORT = process.env.PORT || 5050;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();
