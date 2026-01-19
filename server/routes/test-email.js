// routes/test-email.js
import express from "express";
import { sendEmail } from "../lib/email.js";

const router = express.Router();

router.get("/test-email", async (req, res) => {
  try {
    await sendEmail({
      to: "miatan@gmail.com", // replace with your real inbox
      from: "UBC Boxing Club <no-reply@ubcboxingclub.com>", // MUST be your verified domain
      replyTo: "info@ubcboxingclub.com",
      subject: "UBC Boxing Club - Test Email",
      html: `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;">
          <h2>UBC Boxing Club 👊</h2>
          <p>This is a test email sent via <strong>Resend</strong>.</p>
          <p>If you're reading this, your domain is configured correctly.</p>
          <hr />
          <p style="font-size: 12px; color: #666;">
            This email was sent automatically. No reply required.
          </p>
        </div>
      `,
      text: `UBC Boxing Club 👊

This is a test email sent via Resend.

If you're reading this, your domain is configured correctly.`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Test email failed:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
