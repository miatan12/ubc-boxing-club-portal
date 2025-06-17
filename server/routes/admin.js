import express from "express";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

router.post("/login", (req, res) => {
  const { password } = req.body;

  if (password === process.env.ADMIN_SECRET) {
    return res.json({ success: true });
  } else {
    console.log(req.body);
    return res
      .status(401)
      .json({ success: false, message: "Invalid password" });
  }
});
export default router;
