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
    │   └── services/       # api.js (axios + JWT interceptor)
    └── package.json
```

---

## 🗄 DB Schema

### User
| Field | Type | Notes |
|-------|------|-------|
| name | String | |
| email | String | unique |
| password | String | bcrypt hashed |
| role | Enum | customer / organiser / admin |

### Venue
| Field | Type | Notes |
|-------|------|-------|
| name | String | |
| address | String | |
| seatLayout | Array | `[{ category, rows, cols, rowLabelStart }]` |
| createdBy | ObjectId | ref: User (admin) |

### Event
| Field | Type | Notes |
|-------|------|-------|
| title | String | |
| type | Enum | movie / concert |
| organiser | ObjectId | ref: User |

### Show
| Field | Type | Notes |
|-------|------|-------|
| event | ObjectId | ref: Event |
| venue | ObjectId | ref: Venue |
| date | Date | |
| pricing | Array | `[{ category, price }]` |

### Seat *(one document per seat per show)*
| Field | Type | Notes |
|-------|------|-------|
| show | ObjectId | indexed |
| label | String | e.g. "A1" |
| category | String | e.g. "Premium" |
| price | Number | |
| status | Enum | available / held / booked |
| holdBy | ObjectId | ref: User |
| holdExpiresAt | Date | null when not held |
| bookingId | ObjectId | ref: Booking |

**Indexes:** `{ show, label }` unique · `{ show, status }` compound

### Booking
| Field | Type | Notes |
|-------|------|-------|
| bookingRef | String | unique, encoded in QR |
| user | ObjectId | |
| show | ObjectId | |
| seats | ObjectId[] | |
| seatLabels | String[] | denormalized for email |
| totalAmount | Number | |
| status | Enum | confirmed / cancelled |
| qrCodeDataUrl | String | base64 PNG |

### Waitlist
| Field | Type | Notes |
|-------|------|-------|
| show | ObjectId | |
| category | String | |
| user | ObjectId | |
| status | Enum | waiting / offered / fulfilled / expired / cancelled |
| joinedAt | Date | FIFO ordering key |
| offeredSeat | ObjectId | set when status=offered |
| offerExpiresAt | Date | set when status=offered |

---

## 📡 API Docs

### Auth
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | public | Register customer/organiser |
| POST | /api/auth/login | public | Login, returns JWT |
| GET | /api/auth/me | any | Get current user |

### Venues
| Method | Endpoint | Role |
|--------|----------|------|
| GET | /api/venues | public |
| GET | /api/venues/:id | public |
| POST | /api/venues | admin |
| PUT | /api/venues/:id | admin |
| DELETE | /api/venues/:id | admin |

### Events
| Method | Endpoint | Role |
|--------|----------|------|
| GET | /api/events?type=&search= | public |
| GET | /api/events/:id | public |
| POST | /api/events | organiser |
| PUT | /api/events/:id | organiser |
| DELETE | /api/events/:id | organiser |

### Shows
| Method | Endpoint | Role |
|--------|----------|------|
| GET | /api/shows/event/:eventId | public |
| GET | /api/shows/:id | public |
| POST | /api/shows | organiser |
| GET | /api/shows/organiser/my-shows | organiser |
| GET | /api/shows/organiser/:id/revenue | organiser |

### Seats
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /api/seats/show/:showId | public | Full seat map |
| POST | /api/seats/hold | customer | Atomic seat hold |
| POST | /api/seats/release | customer | Release hold |

### Bookings
| Method | Endpoint | Role |
|--------|----------|------|
| POST | /api/bookings/confirm | customer |
| GET | /api/bookings/my | customer |
| GET | /api/bookings/:id | customer |
| POST | /api/bookings/:id/cancel | customer |

### Waitlist
| Method | Endpoint | Role |
|--------|----------|------|
| POST | /api/waitlist/join | customer |
| GET | /api/waitlist/my | customer |
| GET | /api/waitlist/offer/:entryId | customer |
| DELETE | /api/waitlist/:entryId | customer |

---

## ⚙️ System Design Write-up *(800 words)*

### 1. Seat Hold & TTL Mechanism

When a customer selects seats on the visual map and clicks "Hold Seats", the frontend calls `POST /api/seats/hold` with the list of seat IDs. The backend calculates `holdExpiresAt = now + SEAT_HOLD_TTL_MINUTES` (default 10 minutes, configurable via environment variable) and runs an atomic `findOneAndUpdate` on each seat.

The hold is stored directly on the `Seat` document: `status: "held"`, `holdBy: userId`, `holdExpiresAt: Date`. The frontend receives `holdExpiresAt` from the server and immediately starts a visible countdown timer. The countdown is server-authoritative — the client trusts the server timestamp, not its own clock, to prevent users from extending holds by manipulating local time.

Auto-release is handled by a `node-cron` job that runs every 15 seconds. It queries all seats where `status = "held"` and `holdExpiresAt <= now`, resets them to `status: "available"`, clears `holdBy` and `holdExpiresAt`, and emits a `seat:update` Socket.io event to all clients watching that show. This means every browser watching the seat map sees the released seats turn green in real time without refreshing.

The 15-second sweep is a safety net for checkout abandonment. The hold endpoint itself also reclaims stale holds atomically — if a seat's `holdExpiresAt` has passed, the next customer who tries to hold it wins automatically, even if the sweeper hasn't run yet.

### 2. Concurrency Prevention

The core concurrency challenge: two customers click seat A3 at the exact same millisecond. Without protection, both could read `status: "available"`, both write `status: "held"`, and both proceed to checkout — resulting in a double booking.

The solution is MongoDB's atomic `findOneAndUpdate`. The filter is `{ _id: seatId, $or: [{ status: "available" }, { status: "held", holdExpiresAt: { $lte: now } }] }`. MongoDB processes this as a single atomic operation with document-level locking. Exactly **one** of the two simultaneous requests wins — the other receives `null` and gets a `409 Conflict` response immediately.

No manual locks, no transactions, no Redis-based distributed locks are needed. If any seat in a batch fails the atomic check, all successfully held seats in that batch are rolled back before returning the error — the customer sees "Seat no longer available" and must re-select.

### 3. Waitlist Auto-Assignment Flow

When a show's category sells out, customers can join the waitlist via `POST /api/waitlist/join`. This creates a `Waitlist` document with `status: "waiting"` and `joinedAt: Date.now()`. The `joinedAt` field is the FIFO ordering key — earlier joiners are always served first.

When a booking is cancelled, the `cancelBooking` controller: (1) flips the booking to `cancelled`, (2) releases all its seats back to `available`, (3) emits socket updates so the map refreshes, (4) calls `offerSeatToNextInQueue(showId, category, seat)` for each released seat.

`offerSeatToNextInQueue` runs a `findOneAndUpdate` on the Waitlist collection (sorted by `joinedAt: 1`) to atomically flip the next `waiting` entry to `offered`. It then runs another atomic `findOneAndUpdate` on the Seat to claim it exclusively for that user (held status, with the waitlist offer TTL). If either atomic operation fails (race condition), the function rolls back and exits cleanly.

### 4. Time-Limited Offer Handling

Once a seat is offered to a waitlisted customer, they receive an email (via Resend API) with a direct checkout link and a countdown. They have `WAITLIST_OFFER_TTL_MINUTES` (default 15 minutes) to complete the booking.

The time limit is enforced by a **BullMQ delayed job** scheduled for exactly `offerExpiresAt`. BullMQ uses Redis as its persistence layer — unlike `setTimeout`, it survives server restarts and process crashes. Each job is keyed by the waitlist entry's `_id`, so it can be cancelled precisely if the customer books in time.

When the BullMQ worker fires `expireOfferAndCascade(waitlistEntryId)`: it finds the `Waitlist` entry, checks it is still `offered` (guard against race), flips it to `expired`, releases the seat back to `available`, emits a socket update, and immediately calls `offerSeatToNextInQueue` again — cascading the offer to the next person in line. This cascade continues recursively until someone accepts or the queue is empty.

If the customer completes booking before the timer fires, `fulfillOffer(waitlistEntryId)` marks the entry `fulfilled` and calls `cancelOfferExpiry(waitlistEntryId)` which removes the pending BullMQ job by its `jobId` before it can fire.

### 5. QR Code Generation & Email Delivery

On successful booking, `generateQrCode(bookingRef)` uses the `qrcode` npm package to encode the booking reference string into a base64 PNG data URL. The QR code is stored on the `Booking` document and displayed immediately on the success page. It is also sent as an email attachment via the Resend API — production SMTP on Render's free tier blocks outgoing port 587, so Resend's HTTP API is used instead.

---

## 🚢 Deployment

| Service | What |
|---------|------|
| **Render** | Backend Node.js server |
| **Vercel** | Frontend Vite/React |
| **MongoDB Atlas** | Database (M0 free tier) |
| **Upstash** | Redis for BullMQ (free tier) |
| **Resend** | Email delivery (free tier, 3000/month) |

---

## ✅ Evaluation Checklist

- ✅ Seat hold TTL and auto-release (node-cron sweeper + atomic reclaim)
- ✅ Concurrency protection (MongoDB atomic findOneAndUpdate)
- ✅ Waitlist auto-assignment (FIFO, offerSeatToNextInQueue)
- ✅ Time-limited offer flow (BullMQ delayed jobs, cascade on expiry)
- ✅ Seat map data model (per-seat documents, compound indexes)
- ✅ Real-time seat status updates (Socket.io rooms per show)
- ✅ QR code generation (qrcode npm, base64 PNG)
- ✅ Email delivery with QR attachment (Resend API)
- ✅ Role-based auth (customer / organiser / admin)
- ✅ Organiser revenue dashboard
- ✅ Customer booking history and cancellation
