import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { initSocket } from "./sockets/index.js";
import { startWaitlistWorker } from "./jobs/waitlistWorker.js";
import { startHoldExpirySweeper } from "./jobs/holdExpirySweeper.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import venueRoutes from "./routes/venueRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import showRoutes from "./routes/showRoutes.js";
import seatRoutes from "./routes/seatRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import waitlistRoutes from "./routes/waitlistRoutes.js";

const app = express();
const httpServer = http.createServer(app);

// --- Middleware ---
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);
app.use(express.json());

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/waitlist", waitlistRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// --- Boot ---
const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  initSocket(httpServer); // must happen before any emitSeatUpdate calls
  startWaitlistWorker();
  startHoldExpirySweeper();

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

start();
