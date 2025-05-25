# 🥊 UBC Boxing Club Membership Portal

A full-stack MERN application to manage membership registration, track active/expired plans, and verify attendance for the UBC Boxing Club.

This project replaces the previous Google Forms + QR system with a streamlined digital portal built from scratch using modern web technologies.

---

## 📌 Features

### ✅ Must-Haves (Complete or In Progress)

- **Member Registration**
  - Waiver acceptance, contact info, emergency details
  - Auto-calculated start and expiry dates
- **Admin Dashboard**
  - View, search, and filter members by active/expired status
  - Manual verification of check-ins
- **Database Integration**
  - MongoDB-backed data model for members and payments

### 💡 Nice-to-Haves (Planned)

- Stripe or PayPal integration
- QR code check-in system
- Attendance logs with coach view
- Expiry reminders via email
- Upgrade/renewal functionality

---

## 🛠 Tech Stack

| Layer          | Technology                |
| -------------- | ------------------------- |
| **Frontend**   | React, Tailwind CSS       |
| **Backend**    | Node.js, Express          |
| **Database**   | MongoDB Atlas, Mongoose   |
| **API**        | RESTful routes with Axios |
| **Deployment** | (TBD: Render / Vercel)    |

---

## 📁 Project Structure

ubc-boxing-club-portal/
├── client/ # React frontend
│ └── src/components/RegisterForm.js
├── server/ # Express backend
│ ├── models/ # Mongoose schemas
│ ├── routes/ # API routes
│ └── server.js # Main entry point
├── .env # Local config (not committed)
└── README.md
