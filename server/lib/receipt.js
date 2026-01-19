// lib/receipt.js
function fmtUSD(centsOrNumber) {
  const n =
    typeof centsOrNumber === "number" && centsOrNumber > 1000
      ? centsOrNumber / 100
      : Number(centsOrNumber);
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(n);
}

export function inferPaymentType(amountNumber) {
  const n =
    typeof amountNumber === "number" ? amountNumber : Number(amountNumber);
  if (!Number.isFinite(n)) return "Online"; // fallback
  const r = Math.round(n * 100) / 100;
  return Math.abs(r - 50) < 0.01 || Math.abs(r - 100) < 0.01
    ? "Cash"
    : "Online";
}

export function renderReceiptEmail({
  action, // 'register' | 'dropin' | 'renew'
  memberName,
  email,
  amount, // number (CAD)
  membershipType, // 'term' | 'year' | 'nonstudent' etc
  validFrom, // ISO string (optional)
  validUntil, // ISO string (optional)
  checkInDate, // for drop-in (optional)
  paymentType, // 'Online' | 'Cash'
  reference, // Stripe PI/Session id or your internal id
}) {
  const titleMap = {
    register: "Registration",
    dropin: "Drop-in",
    renew: "Renewal",
  };
  const title = titleMap[action] || "Receipt";
  const pretty = (d) =>
    d
      ? new Date(d).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial">
      <h2>${title} receipt</h2>
      <p>Hi ${
        memberName || "there"
      }, thanks for supporting the UBC Boxing Club.</p>
      <table style="border-collapse:collapse;width:100%;max-width:520px">
        <tbody>
          <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0;text-align:right">${email}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Payment</td><td style="padding:8px 0;text-align:right">${fmtUSD(
            amount
          )} (${paymentType})</td></tr>
          ${
            membershipType
              ? `<tr><td style="padding:8px 0;color:#666">Membership</td><td style="padding:8px 0;text-align:right">${membershipType}</td></tr>`
              : ""
          }
          ${
            checkInDate
              ? `<tr><td style="padding:8px 0;color:#666">Drop-in date</td><td style="padding:8px 0;text-align:right">${pretty(
                  checkInDate
                )}</td></tr>`
              : ""
          }
          ${
            validFrom || validUntil
              ? `
            <tr><td style="padding:8px 0;color:#666">Valid</td>
                <td style="padding:8px 0;text-align:right">${pretty(
                  validFrom
                )} → ${pretty(validUntil)}</td></tr>`
              : ""
          }
          ${
            reference
              ? `<tr><td style="padding:8px 0;color:#666">Reference</td><td style="padding:8px 0;text-align:right">${reference}</td></tr>`
              : ""
          }
        </tbody>
      </table>
      <p style="margin-top:20px;color:#666">Questions? Reply to this email.</p>
    </div>`;

  const text = `${title} receipt
  Email: ${email}
  Payment: ${fmtUSD(amount)} (${paymentType})
  ${membershipType ? `Membership: ${membershipType}\n` : ""}${
    checkInDate ? `Drop-in date: ${pretty(checkInDate)}\n` : ""
  }${
    validFrom || validUntil
      ? `Valid: ${pretty(validFrom)} -> ${pretty(validUntil)}\n`
      : ""
  }${reference ? `Reference: ${reference}\n` : ""}`;

  return { subject: `${title} receipt • UBC Boxing Club`, html, text };
}
