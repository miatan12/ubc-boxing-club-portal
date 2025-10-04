# UBC Boxing Club Membership Portal

A **full-stack MERN application** for managing membership registration, payments, and attendance for the **UBC Boxing Club** — one of Canada’s largest university boxing clubs and winner of *AMS Best Recreation Club 2025*.

This portal replaces the old **Google Forms + QR system** with a unified digital platform for both members and admins.

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

```bash
git clone https://github.com/miatan12/ubc-boxing-club-portal.git
cd ubc-boxing-club-portal
npm install
npm run dev       # frontend
npm run server    # backend
```

# Built and maintained by Mia Tan, UBC Boxing Co-President
Live at https://ubcboxingclub.app/
