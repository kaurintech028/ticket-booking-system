# 🎟 Ticket Booking System

A full-stack ticket booking platform for movies and concerts with real-time seat maps, seat hold TTL, concurrency protection, waitlist auto-assignment, and QR code email tickets.

---

## 🎥 Demo Video

▶️ Watch the complete project demo here:
https://github.com/kaurintech028/ticket-booking-system/issues/1#issue-4806718531

---

## 🌐 Live Demo

- 🚀 **Frontend:** https://ticket-booking-system-alpha.vercel.app
- ⚙️ **Backend API:** https://ticket-booking-system-wntu.onrender.com

> ⚠️ Backend is hosted on Render free tier. On first visit please wait 60 seconds for the server to wake up, then refresh the page.

---

## 🧪 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ticketapp.com | Admin@123 |
| Organiser | organiser@ticketapp.com | Organiser@123 |
| Customer | Register a new account | — |

---

## 🚀 Quick Start

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
# Fill in MONGO_URI, REDIS_URL, JWT_SECRET, and SMTP credentials

# Frontend
cd ../frontend
cp .env.example .env
# Set VITE_API_URL and VITE_SOCKET_URL
```

### 3. Seed Initial Data

```bash
cd backend
npm run seed
```

This creates:

- `admin@ticketapp.com` / `Admin@123`
- `organiser@ticketapp.com` / `Organiser@123`
- Sample venue "Grand Arena" (3×10 Premium + 5×15 Standard)
- Sample event "Rock Night 2025"

### 4. Run

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
│   │   ├── sockets/        # Socket.io setup + emitSeatUpdate helper
│   │   └── utils/          # jwt, qrcode, email, bookingRef, seed
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/     # Navbar, SeatMap (with socket updates)
    │   ├── context/        # AuthContext
    │   ├── pages/          # Login, Register, Events, SeatSelection, Checkout,
    │   │                   # BookingSuccess, MyBookings, MyWaitlist,
    │   │                   # OrganiserDashboard, AdminDashboard
    │   └── services/       # api.js (axios instance with JWT interceptor)
    └── package.json
```

---

## 🗄 Database Schema

### User

| Field    | Type   | Notes                        |
| -------- | ------ | ---------------------------- |
| name     | String |                              |
| email    | String | unique                       |
| password | String | bcrypt hashed                |
| role     | Enum   | customer / organiser / admin |

### Venue

| Field      | Type     | Notes                                       |
| ---------- | -------- | ------------------------------------------- |
| name       | String   |                                             |
| address    | String   |                                             |
| seatLayout | Array    | `[{ category, rows, cols, rowLabelStart }]` |
| createdBy  | ObjectId | ref: User (admin)                           |

### Event

| Field     | Type     | Notes           |
| --------- | -------- | --------------- |
| title     | String   |                 |
| type
