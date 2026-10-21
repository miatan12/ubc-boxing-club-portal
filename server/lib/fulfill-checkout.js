export const PLAN_CENTS = { term: 5155, year: 10310, nonstudent: 8250, dropin: 500 };

export function computeDates(plan, paidAt) {
  const start = new Date(paidAt);
  const expiry = new Date(start);
  expiry.setMonth(expiry.getMonth() + (plan === "year" ? 12 : 4));
  return { start, expiry };
}

// Only a verified Stripe webhook calls this function. It never looks up a
// registration by the email entered in Stripe, which can differ from the form.
export async function fulfillCheckout(session, { Checkout, Member }) {
  if (session.payment_status !== "paid") throw new Error("Checkout is not paid.");
  const checkout = await Checkout.findOne({ sessionId: session.id });
  if (!checkout) throw new Error("Pending checkout not found.");
  if (session.metadata?.flow !== checkout.flow ||
      session.metadata?.plan !== checkout.plan ||
      session.currency !== "cad" ||
      session.amount_total !== PLAN_CENTS[checkout.plan]) {
    throw new Error("Checkout payment does not match the saved registration.");
  }

  // Stable dates ensure retries cannot move the membership's expiry forward.
  const paidAt = new Date(session.created * 1000);
  const { start, expiry } = computeDates(checkout.plan, paidAt);
  if (checkout.fulfilledAt) return { checkout, start, expiry };
  const payment = {
    membershipType: checkout.plan,
    startDate: start,
    expiryDate: expiry,
    paymentMethod: "online",
    paymentAmount: session.amount_total / 100,
    paymentDate: paidAt,
    status: "active",
  };

  if (checkout.flow === "register") {
    if (!checkout.registration) throw new Error("Registration details are missing.");
    const member = new Member({
      ...checkout.registration,
      ...payment,
      _id: checkout._id,
      membershipKey: session.id,
    });
    await member.validate();
    try {
      await Member.updateOne(
        { _id: checkout._id },
        { $setOnInsert: member.toObject() },
        { upsert: true, runValidators: true },
      );
    } catch (err) {
      // Concurrent delivery can race on the built-in unique _id index.
      if (err.code !== 11000 || !await Member.exists({
        _id: checkout._id, membershipKey: session.id,
      })) throw err;
    }
  } else if (checkout.flow === "renew") {
    if (!checkout.memberId || !await Member.exists({ _id: checkout.memberId })) {
      throw new Error("Renewal member not found.");
    }
    await Member.updateOne(
      {
        _id: checkout.memberId,
        appliedCheckoutSessions: { $ne: session.id },
        // An older delivery must not overwrite a more recent payment.
        $or: [{ paymentDate: { $lte: paidAt } }, { paymentDate: null }],
      },
      { $set: payment, $addToSet: { appliedCheckoutSessions: session.id } },
      { runValidators: true },
    );
  }

  await Checkout.updateOne(
    { _id: checkout._id },
    { $set: { fulfilledAt: checkout.fulfilledAt || paidAt } },
  );
  return { checkout, start, expiry };
}
