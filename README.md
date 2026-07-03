# 🎟 Ticket Booking System

A full-stack ticket booking platform for movies and concerts with real-time seat maps, seat hold TTL, concurrency protection, waitlist auto-assignment, and QR code email tickets.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or [Atlas free tier](https://www.mongodb.com/atlas))
- Redis (local or [Upstash free tier](https://upstash.com))

### 1. Clone & Install

```bash
git clone https://github.com/your-username/ticket-booking-system
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
│   │   ├── middleware/      # auth.js (JWT + role guard)
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
| category | String | |
| price | Number | |
| status | Enum | available / held / booked |
| holdBy | ObjectId | ref: User |
| holdExpiresAt | Date | null when not held |
| bookingId | ObjectId | ref: Booking (when booked) |

**Indexes:** `{ show, label }` unique, `{ show, status }` compound.

### Booking
| Field | Type | Notes |
|-------|------|-------|
| bookingRef | String | unique, encoded in QR |
| user | ObjectId | |
| show | ObjectId | |
| seats | ObjectId[] | |
| seatLabels | String[] | denormalized |
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

## 📡 API Reference

### Auth
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | public | Register (customer/organiser) |
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
| POST | /api/seats/hold | customer | Atomically hold seats |
| POST | /api/seats/release | customer | Explicitly release hold |

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

## ⚙️ System Design Write-up

### Seat Hold & TTL Mechanism

When a customer selects seats, the frontend calls `POST /api/seats/hold`. The backend uses a MongoDB `findOneAndUpdate` with a **filter on `status: "available"`** (or an expired hold) to atomically transition the seat to `status: "held"`, setting `holdExpiresAt = now + TTL` (default 10 minutes, configurable via `SEAT_HOLD_TTL_MINUTES`).

A `node-cron` sweeper runs every 15 seconds and finds all seats where `holdExpiresAt <= now && status = "held"`, releasing them back to `available` and emitting a `seat:update` socket event so every connected client's seat map repaints in real time. This 15-second sweep is the safety net for checkout abandonment — the seat map stays accurate even between sweeps because the hold endpoint itself reclaims expired holds atomically on the next request.

### Concurrency Prevention

Two customers simultaneously clicking the same seat both hit `findOneAndUpdate({ status: "available" })`. MongoDB's document-level locking guarantees exactly **one** succeeds and one gets `null` back. The losing request receives a 409 response immediately — no race condition, no double booking. If any seat in a batch fails, all successfully held seats in that batch are rolled back atomically before returning the error.

### Waitlist Auto-Assignment Flow

1. When a category sells out, customers call `POST /api/waitlist/join`, creating a `Waitlist` entry with `status: "waiting"` and `joinedAt: Date.now()`.
2. On any cancellation (or hold expiry), `offerSeatToNextInQueue()` runs: it finds the next `waiting` entry sorted by `joinedAt` (FIFO), atomically flips it to `"offered"`, places a dedicated hold on the released seat for that user's `_id`, and sends them an email with a direct checkout link.
3. A **BullMQ delayed job** is scheduled for exactly `offerExpiresAt`. BullMQ uses Redis for persistence — unlike `setTimeout`, it survives server restarts.

### Time-Limited Offer Handling

When the BullMQ job fires, `expireOfferAndCascade()` runs: it flips the waitlist entry to `"expired"`, releases the seat back to `"available"`, then calls `offerSeatToNextInQueue()` again — cascading the offer to the next person in line. This continues until either someone accepts or the queue empties. If the offered customer completes checkout before expiry, `fulfillOffer()` is called, which marks the entry `"fulfilled"` and cancels the pending BullMQ job via `jobId`-based removal.

---

## 📧 Email Setup (Gmail SMTP)

1. Enable 2FA on your Gmail account.
2. Generate an **App Password** (Google Account → Security → App Passwords).
3. Set `SMTP_USER=youremail@gmail.com` and `SMTP_PASS=your_app_password` in `.env`.

For production, consider [Resend](https://resend.com) or [Brevo](https://brevo.com) (free tiers available).

---

## 🚢 Deployment

| Service | What |
|---------|------|
| **Railway / Render** | Backend (Node.js) |
| **Vercel** | Frontend (Vite React) |
| **MongoDB Atlas** | Free tier (M0) |
| **Upstash** | Redis (free tier, 10k commands/day) |

Set all `.env` variables as environment variables in your hosting dashboard.
