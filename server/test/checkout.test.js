import test from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import Checkout from "../models/Checkout.js";
import Member from "../models/Member.js";

process.env.STRIPE_SECRET_KEY = "sk_test_mock";
const { default: router } = await import("../routes/checkout.js");
const sessionPrototype = Object.getPrototypeOf(new Stripe("sk_test_mock").checkout.sessions);
const create = router.stack.find((layer) => layer.route?.path === "/create-checkout-session").route.stack[0].handle;
const status = router.stack.find((layer) => layer.route?.path === "/session-status").route.stack[0].handle;
const registration = {
  name: "Test Boxer", studentNumber: "12345678", waiverSigned: true,
  emergencyContactName: "Emergency Contact", emergencyContactPhone: "6045550100",
  emergencyContactRelation: "Parent",
};
function response() {
  return {
    statusCode: 200,
    set() { return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("checkout saves full registration before opening Stripe, without creating a member", async (t) => {
  const steps = [];
  let draft;
  t.mock.method(Checkout, "create", async (data) => {
    steps.push("draft");
    draft = new Checkout(data);
    return draft;
  });
  t.mock.method(Checkout.prototype, "save", async function () {
    steps.push("session-linked");
    return this;
  });
  t.mock.method(Member.prototype, "save", async () => assert.fail("Unpaid member was saved"));
  t.mock.method(sessionPrototype, "create", async (payload) => {
    steps.push("stripe");
    assert.equal(payload.metadata.checkoutId, String(draft._id));
    assert.equal(payload.line_items[0].price_data.unit_amount, 5155);
    return { id: "cs_test_paid", url: "https://checkout.stripe.com/test" };
  });
  const res = response();
  await create({ body: { type: "register", plan: "term", email: " BOXER@example.com ", registration } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(steps, ["draft", "stripe", "session-linked"]);
  assert.equal(draft.sessionId, "cs_test_paid");
  assert.equal(draft.registration.email, "boxer@example.com");
  for (const [key, value] of Object.entries(registration)) assert.equal(draft.registration[key], value);
  assert.equal(draft.fulfilledAt, undefined);
});

test("incomplete forms and unsigned waivers cannot open Stripe checkout", async (t) => {
  t.mock.method(Checkout, "create", async () => assert.fail("Invalid draft saved"));
  t.mock.method(sessionPrototype, "create", async () => assert.fail("Invalid form reached Stripe"));
  t.mock.method(console, "error", () => {});
  for (const patch of [{ emergencyContactPhone: "" }, { waiverSigned: false }]) {
    const res = response();
    await create({ body: {
      type: "register", plan: "term", email: "boxer@example.com",
      registration: { ...registration, ...patch },
    } }, res);
    assert.equal(res.statusCode, 400);
  }
});

test("drop-in cannot be used as a membership plan", async () => {
  const res = response();
  await create({ body: { type: "register", plan: "dropin" } }, res);
  assert.equal(res.statusCode, 400);
});

test("success-page status is read-only and exposes no registration fields", async (t) => {
  t.mock.method(Checkout, "findOne", async () => ({
    flow: "register", fulfilledAt: new Date(), registration,
  }));
  t.mock.method(Checkout, "updateOne", async () => assert.fail("Status wrote checkout"));
  t.mock.method(Member, "updateOne", async () => assert.fail("Status wrote member"));
  const res = response();
  await status({ query: { session_id: "cs_test_paid" } }, res);
  assert.deepEqual(res.body, { flow: "register", fulfilled: true });
});
