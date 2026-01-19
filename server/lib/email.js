// server/lib/email.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Fallbacks so emails never fail due to missing fields
const DEFAULT_FROM =
  process.env.FROM_EMAIL || "UBC Boxing Club <no-reply@ubcboxingclub.app>";

const DEFAULT_REPLY_TO = process.env.REPLY_TO_EMAIL || "info@ubcboxingclub.app";

export async function sendEmail({ to, subject, html, text, from, replyTo }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing");
  }

  if (!to) {
    throw new Error("Missing `to` email address");
  }

  const payload = {
    from: from || DEFAULT_FROM,
    to,
    subject,
    html,
    text,
    reply_to: replyTo || DEFAULT_REPLY_TO,
  };

  const result = await resend.emails.send(payload);

  if (result?.error) {
    throw new Error(result.error.message || "Resend failed");
  }

  console.log("Email sent:", {
    to,
    subject,
    id: result?.data?.id || null,
  });

  return result;
}
