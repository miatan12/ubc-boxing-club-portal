import test from "node:test";
import assert from "node:assert/strict";
import Member from "../models/Member.js";
import { fulfillCheckout } from "../lib/fulfill-checkout.js";

const registration = {
  name: "Test Boxer",
  email: "boxer@example.com",
  studentNumber: "12345678",
  emergencyContactName: "Emergency Contact",
  emergencyContactPhone: "6045550100",
  emergencyContactRelation: "Parent",
  waiverSigned: true,
};

function fixture(flow = "register") {
  const checkout = {
    _id: "507f1f77bcf86cd799439011",
    flow,
    plan: flow === "dropin" ? "dropin" : "term",
    registration: { ...registration },
    memberId: flow === "renew" ? "507f1f77bcf86cd799439012" : undefined,
  };
  const session = {
    id: "cs_test_paid",
    created: 1792530000,
    payment_status: "paid",
    currency: "cad",
    amount_total: flow === "dropin" ? 500 : 5155,
    metadata: { flow, plan: checkout.plan },
    customer_details: { email: "different-stripe-email@example.com" },
  };
  const records = new Map();
  const writes = [];
  let missingMember = false;
  // Use the real Mongoose schema for validation, with an in-memory persistence
  // boundary so these tests require neither MongoDB nor live Stripe credentials.
  function MemberStore(data) { return new Member(data); }
  MemberStore.exists = async (query) => !missingMember;
  MemberStore.updateOne = async (filter, update, options) => {
    writes.push({ filter, update, options });
    const id = String(filter._id);
    if (update.$setOnInsert && !records.has(id)) records.set(id, update.$setOnInsert);
    return { matchedCount: 1 };
  };
  const Checkout = {
    findOne: async ({ sessionId }) => sessionId === session.id ? checkout : null,
    updateOne: async (_filter, { $set }) => Object.assign(checkout, $set),
  };
  return {
    checkout, session, records, writes,
    models: { Checkout, Member: MemberStore },
    removeMember: () => { missingMember = true; },
  };
}

test("payment creates one full member even when Stripe's email differs", async () => {
  const f = fixture();
  await fulfillCheckout(f.session, f.models);
  assert.equal(f.records.size, 1);
  const member = [...f.records.values()][0];
  for (const [key, value] of Object.entries(registration)) assert.equal(member[key], value);
  assert.equal(member.membershipKey, f.session.id);
  assert.equal(String(member._id), f.checkout._id);
  assert.equal(member.paymentAmount, 51.55);
  assert.ok(f.checkout.fulfilledAt);
});

test("sequential and concurrent webhook deliveries keep one record and stable dates", async () => {
  const f = fixture();
  await Promise.all([
    fulfillCheckout(f.session, f.models),
    fulfillCheckout(f.session, f.models),
  ]);
  const member = [...f.records.values()][0];
  const expiry = member.expiryDate.toISOString();
  await fulfillCheckout(f.session, f.models);
  assert.equal(f.records.size, 1);
  assert.equal(member.expiryDate.toISOString(), expiry);
  assert.ok(f.writes.every(({ filter, options }) =>
    filter._id === f.checkout._id && options.upsert && options.runValidators));
});

test("a retry after membership saved but before fulfillment marked uses the same member ID", async () => {
  const f = fixture();
  let fail = true;
  const save = f.models.Checkout.updateOne;
  f.models.Checkout.updateOne = async (...args) => {
    if (fail) { fail = false; throw new Error("temporary DB failure"); }
    return save(...args);
  };
  await assert.rejects(fulfillCheckout(f.session, f.models), /temporary DB failure/);
  assert.equal(f.records.size, 1);
  assert.equal(f.checkout.fulfilledAt, undefined);
  await fulfillCheckout(f.session, f.models);
  assert.equal(f.records.size, 1);
  assert.ok(f.checkout.fulfilledAt);
});

test("incomplete registration never writes a member or marks fulfillment", async () => {
  const f = fixture();
  delete f.checkout.registration.emergencyContactPhone;
  await assert.rejects(fulfillCheckout(f.session, f.models), /emergencyContactPhone/);
  assert.equal(f.writes.length, 0);
  assert.equal(f.checkout.fulfilledAt, undefined);
});

test("unpaid, mismatched, and unknown sessions cannot create members", async () => {
  for (const patch of [
    { payment_status: "unpaid" },
    { currency: "usd" },
    { amount_total: 1 },
    { metadata: { flow: "renew", plan: "term" } },
  ]) {
    const f = fixture();
    await assert.rejects(fulfillCheckout({ ...f.session, ...patch }, f.models));
    assert.equal(f.writes.length, 0);
  }
  const f = fixture();
  f.models.Checkout.findOne = async () => null;
  await assert.rejects(fulfillCheckout(f.session, f.models), /not found/);
  assert.equal(f.writes.length, 0);
});

test("renewal updates the bound member without upserting or overwriting identity", async () => {
  const f = fixture("renew");
  await fulfillCheckout(f.session, f.models);
  await fulfillCheckout(f.session, f.models);
  assert.equal(f.writes.length, 1);
  const { filter, update, options } = f.writes[0];
  assert.equal(filter._id, f.checkout.memberId);
  assert.equal(filter.appliedCheckoutSessions.$ne, f.session.id);
  assert.equal(update.$addToSet.appliedCheckoutSessions, f.session.id);
  assert.equal(update.$set.name, undefined);
  assert.equal(update.$set.email, undefined);
  assert.equal(options.upsert, undefined);
  assert.ok(filter.$or[0].paymentDate.$lte instanceof Date);
  assert.equal(f.records.size, 0);
});

test("missing renewal member cannot become an incomplete registration", async () => {
  const f = fixture("renew");
  f.removeMember();
  await assert.rejects(fulfillCheckout(f.session, f.models), /member not found/);
  assert.equal(f.writes.length, 0);
  assert.equal(f.checkout.fulfilledAt, undefined);
});

test("drop-in is confirmed without creating a member", async () => {
  const f = fixture("dropin");
  await fulfillCheckout(f.session, f.models);
  assert.equal(f.writes.length, 0);
  assert.ok(f.checkout.fulfilledAt);
});
