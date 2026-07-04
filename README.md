# 🎟 Ticket Booking System

A full-stack ticket booking platform for movies and concerts where customers book seats from a visual map, held seats auto-release on checkout abandonment, sold-out events have a waitlist with automatic seat assignment on cancellation, and every confirmed booking produces an email with a QR code ticket.

---

## 🎥 Demo Video

▶️ Watch the complete project demo here:
https://github.com/kaurintech028/ticket-booking-system/issues/1#issue-4806718531

---

## 🌐 Hosted Application

- 🚀 **Frontend (Vercel):** https://ticket-booking-system-alpha.vercel.app
- ⚙️ **Backend API (Render):** https://ticket-booking-system-wntu.onrender.com

> ⚠️ Backend is hosted on Render free tier. On first visit please wait 60 seconds for the server to wake up, then refresh the page.

---

## 🧪 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ticketapp.com | Admin@123 |
| Organiser | organiser@ticketapp.com | Organiser@123 |
| Customer | Register a new account | — |

---

## 🚀 Setup Guide

### Prerequisites

- Node.js 18+
- MongoDB (local or [Atlas free tier](https://www.mongodb.com/atlas))
- Redis (local or [Upstash free tier](https://upstash.com))

### 1. Clone & Install

```bash
git clone https://github.com/kaurintech028/ticket-booking-system
cd ticket-booking-system

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Environment Setup

```bash
# Backend
cd backend
cp .env.example .env
# Fill in all values as described below
```

### 3. .env.example (Backend)

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Atlas connection string
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/ticket-booking?appName=Cluster0

# Upstash Redis URL
REDIS_URL=rediss://default:<password>@<endpoint>.upstash.io:6379

# JWT
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d

# Seat hold TTL in minutes
SEAT_HOLD_TTL_MINUTES=10

# Waitlist offer TTL in minutes
WAITLIST_OFFER_TTL_MINUTES=15

# Email (Gmail SMTP for local, Resend for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM="Ticket Booking <youremail@gmail.com>"

# Resend API (for production deployment)
RESEND_API_KEY=re_your_resend_api_key
```

### 4. Seed Initial Data

```bash
cd backend
npm run seed
```

Creates:
- `admin@ticketapp.com` / `Admin@123`
- `organiser@ticketapp.com` / `Organiser@123`
- Sample venue "Grand Arena"
- Sample event "Rock Night 2025"

### 5. Run Locally

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

---

## 📦 Project Structure

```
ticket-booking-system/
├── backend/
│   ├── src/
│   │   ├── config/         # db.js, redis.js
│   │   ├── models/         # User, Venue, Event, Show, Seat, Booking, Waitlist
│   │   ├── controllers/    # auth, venue, event, show, seat, booking, waitlist
│   │   ├── routes/         # REST API routes
│   │   ├── middleware/     # auth.js (JWT + role guard)
│   │   ├── services/       # waitlistService.js (core offer logic)
│   │   ├── queues/         # BullMQ waitlist-offer-expiry queue
│   │   ├── jobs/           # BullMQ worker + hold expiry sweeper cron
│   │   ├── sockets/        # Socket.io real-time seat map updates
│   │   └── utils/          # jwt, qrcode, email, bookingRef, seed
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/     # Navbar, SeatMap (real-time socket updates)
    │   ├── context/        # AuthContext (JWT state)
    │   ├── pages/          # Login, Register, Events, SeatSelection,
    │   │                   # Checkout, BookingSuccess, MyBookings,
    │   │                   # MyWaitlist, OrganiserDashboard, AdminDashboard
