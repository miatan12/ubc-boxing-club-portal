# UBC Boxing Club Membership Portal

A **full-stack MERN application** for managing membership registration, payments, and attendance for the **UBC Boxing Club** — one of Canada’s largest university boxing clubs and winner of *AMS Best Recreation Club 2024-25*.

This portal replaces the old **Google Forms + QR system** with a unified digital platform for both members and admins.

Live at https://ubcboxingclub.app/

---

## Features

### Core
- **Member Registration:** Waiver confirmation, auto start/expiry dates, Stripe or cash payment options  
- **Admin Dashboard:** Search/filter members, verify check-ins, view payment history  
- **Payment Tracking:** Stripe integration, transaction logs, expiry automation  

### Advanced (In Progress)
- Renewal & self-service membership updates  
- Automatic cleanup of expired members  
- Attendance tracking & analytics  
- Email expiry reminders  
- Admin authentication & dark mode  

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB Atlas (Mongoose) |
| Payments | Stripe API |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Quick Start

Run these commands from the repository root, in separate terminals:

```bash
cd server
npm ci
cp .env.example .env
# Fill in .env before starting the server.
npm start
```

```bash
cd client
npm ci
npm start
```

Open http://localhost:3000. The local frontend uses the API on port 5050.

## Test sandbox payments locally

Use a separate MongoDB development database in `server/.env`, a Stripe sandbox
secret key, and an email API key/sender that can send to your test inbox. Local
environment files are ignored by Git. This checkout uses hosted Stripe Checkout,
so a publishable key is not needed in the frontend.

Install the [Stripe CLI](https://docs.stripe.com/stripe-cli), log in to the same
sandbox as the server's key, and leave this running in another terminal:

```bash
stripe login
stripe listen --events checkout.session.completed --forward-to http://localhost:5050/api/stripe/webhook
```

Copy the listener's `whsec_...` secret into `STRIPE_WEBHOOK_SECRET` in
`server/.env`, then restart the server. The listener secret is separate from a
deployed webhook's signing secret.

1. Register through the local app using an email you control and choose online
   payment. Before payment, the `checkouts` collection should contain the full
   registration; the `members` collection should have no new member.
2. Complete checkout with test card `4242 4242 4242 4242`, a future expiry, and
   any three-digit CVC. Expect a successful webhook response, a successful
   confirmation page, and exactly one complete member including emergency
   contact, student number, and waiver. Its `membershipKey` should equal the
   Stripe `cs_...` session ID and its `_id` should match the pending checkout ID.
3. Reopen `/success?session_id=cs_...` using that same ID several times, including
   in a private browser window. The member count should stay at one.
4. Start another registration and cancel checkout. Expect a pending checkout,
   but no new member. Also check cash registration, renewal of an expired test
   member, and drop-in payment; drop-ins should never create members.

Use the app to create the payment for this test. A generic `stripe trigger`
fixture has no matching saved registration and is intentionally rejected.

Run automated regression tests (including duplicate/concurrent webhook delivery)
and the frontend production build:

```bash
npm --prefix server test
CI=true npm --prefix client test -- --watchAll=false --runInBand --runTestsByPath src/components/SuccessPage.test.js
npm --prefix client run build
```

The regression tests use mocked database/API boundaries with real member schema
validation; the sandbox walkthrough verifies the live MongoDB/Stripe integration.

## Payment fulfillment and deployment

Registration details are saved in `checkouts` before redirecting to Stripe.
Only the signed webhook creates a paid member, using the checkout's `_id` so
retries cannot create another record. Renewals update the member ID bound before
checkout. The return page reads fulfillment status instead of posting member
data. Database and email failures return HTTP 500 so Stripe can retry; receipt
requests also use an idempotency key.

Deploy the backend and frontend together: updating only Vercel does not deploy
the Express server changes. Checkouts opened before this change have no saved
server-side registration and require manual reconciliation if paid during the
rollout. Existing duplicate member records are not automatically modified.

This project is licensed under the **MIT License** — see the [LICENSE.md](LICENSE.md) file for details.
