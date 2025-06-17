import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import memberRoutes from "./routes/members.js";
import checkoutRoutes from "./routes/checkout.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/checkout", checkoutRoutes);
app.use("/api/members", memberRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
