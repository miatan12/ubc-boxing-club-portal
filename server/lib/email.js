// lib/email.js
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY in environment.");
    return;
  }

  try {
    const data = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html,
      text,
    });
    console.log("Email sent:", data);
  } catch (err) {
    console.error("Email send failed:", err);
  }
}