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
CI=true npm --prefix client test -- --watchAll=false --runInBand
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

## Pull request checks

GitHub Actions runs `.github/workflows/ci.yml` for every pull request and pushes
to `master`. It uses Node.js 22 on standard Ubuntu runners and reports two checks:

- **Server tests**: runs the payment and member route regression tests.
- **Frontend tests and build**: runs the complete frontend test suite and creates
  the production build with CI warnings treated as failures.

These checks use mocked external services and do not need repository secrets,
Stripe credentials, or a running MongoDB instance. Superseded runs are cancelled
to avoid wasting runner minutes. The frontend Jest configuration maps React
Router's package exports for compatibility with Create React App's older Jest
resolver; routing tests use the real router.

After pushing the workflow and letting it run once on a PR, go to the GitHub
repository's **Settings → Rules → Rulesets**, create an active branch ruleset for
`master`, and enable:

- Require a pull request before merging, with no required approving reviews for
  a solo-maintainer workflow.
- Require status checks to pass, selecting **Server tests** and **Frontend tests
  and build** after they appear in the selector.
- Block force pushes and branch deletion.

Branch protection availability depends on the GitHub plan and repository
visibility. Passing checks do not prevent direct pushes unless branch rules are
enabled. The workflow itself does not deploy the app.

Dependabot configuration in `.github/dependabot.yml` checks root, frontend,
backend, and GitHub Actions dependencies weekly. Minor/patch updates are grouped,
major updates remain separate, and security updates have their own group. It
does not automatically merge updates. Dependabot begins using this configuration
once it is on the default branch. In the repository's security settings, also
enable **Dependabot alerts** and **Dependabot security updates**; the YAML file
does not enable these account-side settings.

This project is licensed under the **MIT License** — see the [LICENSE.md](LICENSE.md) file for details.
