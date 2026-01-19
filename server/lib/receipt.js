// server/lib/receipt.js
function money(amount, currency = "CAD") {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
  }).format(Number(amount || 0));
}

function prettyPlan(plan) {
  if (plan === "term") return "Student — 1 Term (4 months)";
  if (plan === "year") return "Student — 3 Terms (12 months)";
  if (plan === "nonstudent") return "Non-Student — 4 months";
  if (plan === "dropin") return "Drop-in (single class)";
  return plan || "Membership";
}

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function renderReceiptEmail({
  action, // "register" | "renew" | "dropin"
  memberName,
  email,
  amount,
  membershipType,
  validFrom,
  validUntil,
  checkInDate,
  paymentType,
  receiptUrl,
  currency = "CAD",
}) {
  const name = memberName?.trim() || "there";
  const planLabel = prettyPlan(membershipType);
  const paid = money(amount, currency);

  // --- copy by action ---
  let subject;
  let headline;
  let intro;

  if (action === "register") {
    subject = "Welcome to UBC Boxing Club — Membership confirmed";
    headline = "Welcome to UBC Boxing Club!";
    intro = `Your membership registration is confirmed. We're excited to have you.`;
  } else if (action === "renew") {
    subject = "UBC Boxing Club — Renewal confirmed";
    headline = "Renewal confirmed";
    intro = `Thanks for renewing — your membership is active again.`;
  } else {
    subject = "UBC Boxing Club — Drop-in confirmed";
    headline = "Drop-in confirmed";
    intro = `You're all set for a drop-in session. Show this email (or the receipt) at the door.`;
  }

  const validityLine =
    action === "dropin"
      ? checkInDate
        ? `Drop-in date: ${fmtDate(checkInDate)}`
        : null
      : `Valid: ${fmtDate(validFrom)} → ${fmtDate(validUntil)}`;

  const receiptBlockHtml = receiptUrl
    ? `
      <div style="margin-top:16px;">
        <a href="${receiptUrl}" target="_blank" rel="noopener noreferrer"
          style="display:inline-block;padding:12px 16px;border-radius:12px;background:#dc2626;color:#fff;text-decoration:none;font-weight:700;">
          View Stripe Receipt
        </a>
        <div style="font-size:12px;color:#6b7280;margin-top:8px;">
          If the button doesn't work, copy/paste this link: <br/>
          <span style="word-break:break-all;">${receiptUrl}</span>
        </div>
      </div>
    `
    : `
      <div style="margin-top:16px;font-size:12px;color:#6b7280;">
        Receipt link unavailable (but your payment is confirmed).
      </div>
    `;

  const detailsRows = `
    <div style="margin-top:16px;padding:14px;border:1px solid #e5e7eb;border-radius:14px;background:#fafafa;">
      <div style="font-size:14px;margin-bottom:8px;"><strong>Details</strong></div>
      <div style="font-size:14px;line-height:1.6;color:#111827;">
        <div><strong>Name:</strong> ${name}</div>
        <div><strong>Email:</strong> ${email}</div>
        <div><strong>Type:</strong> ${planLabel}</div>
        <div><strong>Amount:</strong> ${paid}</div>
        <div><strong>Payment:</strong> ${paymentType || "Online"}</div>
        ${validityLine ? `<div><strong>${action === "dropin" ? "When" : "Validity"}:</strong> ${validityLine.replace("Valid: ", "")}</div>` : ""}
      </div>
    </div>
  `;

  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 18px; color:#111827;">
      <div style="max-width: 520px; margin: 0 auto;">
        <div style="font-size: 20px; font-weight: 800; margin-bottom: 6px;">${headline}</div>
        <div style="font-size: 14px; color:#374151;">Hi ${name},</div>
        <div style="font-size: 14px; color:#374151; margin-top: 10px;">${intro}</div>

        ${detailsRows}

        ${receiptBlockHtml}

        <div style="margin-top:18px;font-size:12px;color:#6b7280;">
          Questions? Reply to this email.
        </div>
      </div>
    </div>
  `;

  const textLines = [
    headline,
    `Hi ${name},`,
    intro,
    "",
    "DETAILS",
    `Name: ${name}`,
    `Email: ${email}`,
    `Type: ${planLabel}`,
    `Amount: ${paid}`,
    `Payment: ${paymentType || "Online"}`,
    validityLine
      ? action === "dropin"
        ? `Drop-in date: ${fmtDate(checkInDate)}`
        : `Valid: ${fmtDate(validFrom)} -> ${fmtDate(validUntil)}`
      : "",
    "",
    receiptUrl
      ? `Stripe receipt: ${receiptUrl}`
      : "Stripe receipt: (unavailable)",
    "",
    "Questions? Reply to this email.",
  ].filter(Boolean);

  return { subject, html, text: textLines.join("\n") };
}
