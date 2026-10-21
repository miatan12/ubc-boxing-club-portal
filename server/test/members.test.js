import test from "node:test";
import assert from "node:assert/strict";
import router from "../routes/members.js";
import Member from "../models/Member.js";

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

const body = {
  name: "Test Boxer", email: "boxer@example.com", studentNumber: "12345678",
  emergencyContactName: "Emergency Contact", emergencyContactPhone: "6045550100",
  emergencyContactRelation: "Parent", waiverSigned: true, membershipType: "term",
  startDate: "2026-10-21", expiryDate: "2027-02-21", paymentMethod: "online",
};

const registrations = router.stack.filter((layer) => layer.route?.path === "/" && layer.route.methods.post);

test("both direct registration routes reject online member creation", async (t) => {
  let saves = 0;
  t.mock.method(Member.prototype, "save", async () => { saves++; });
  for (const layer of registrations) {
    const handler = layer.route.stack.at(-1).handle;
    const res = response();
    await handler({ headers: { "content-type": "application/json" }, body }, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, /checkout/);
  }
  assert.equal(saves, 0);
});

test("cash registration remains available in JSON and multipart routes", async (t) => {
  const saved = [];
  t.mock.method(Member.prototype, "save", async function () { saved.push(this); return this; });
  for (const layer of registrations) {
    const res = response();
    await layer.route.stack.at(-1).handle({
      headers: { "content-type": "application/json" },
      body: { ...body, paymentMethod: "cash", cashReceiver: "Club Exec" },
    }, res);
    assert.equal(res.statusCode, 201);
  }
  assert.equal(saved.length, 2);
  assert.ok(saved.every((member) => member.paymentAmount === 50 && member.cashReceiver === "Club Exec"));
});

test("the old online renewal endpoint cannot apply an unverified payment", async (t) => {
  t.mock.method(Member, "findOne", async () => new Member(body));
  let saves = 0;
  t.mock.method(Member.prototype, "save", async () => { saves++; });
  const route = router.stack.find((layer) => layer.route?.path === "/renew").route;
  const res = response();
  await route.stack[0].handle({ body: {
    email: body.email, paymentMethod: "online", paymentAmount: 51.55,
    newExpiryDate: "2027-02-21",
  } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(saves, 0);
});
