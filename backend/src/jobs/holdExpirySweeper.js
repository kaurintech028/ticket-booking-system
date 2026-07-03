import cron from "node-cron";
import Seat from "../models/Seat.js";
import { emitSeatUpdate } from "../sockets/index.js";
import { offerSeatToNextInQueue } from "../services/waitlistService.js";

/**
 * Runs every 15 seconds. This is the safety-net for normal customer
 * checkout abandonment (NOT waitlist offers, which are handled by the
 * BullMQ worker for precise timing). Mongo TTL alone can't easily flip a
 * field back to a different value, so we sweep for expired holds here.
 *
 * Note: the seat-hold endpoint itself ALSO atomically reclaims expired
 * holds the instant a new customer tries to hold the seat (see
 * seatController.js), so seats never actually appear "stuck" to users
 * even between sweeps - this cron is just for keeping the DB/seat map
 * status accurate for everyone else watching in real time.
 */
export function startHoldExpirySweeper() {
  cron.schedule("*/15 * * * * *", async () => {
    try {
      const now = new Date();
      const expiredSeats = await Seat.find({
        status: "held",
        holdExpiresAt: { $lte: now },
      });

      if (expiredSeats.length === 0) return;

      const byShow = {};
      for (const seat of expiredSeats) {
        seat.status = "available";
        seat.holdBy = null;
        seat.holdExpiresAt = null;
        await seat.save();

        byShow[seat.show] = byShow[seat.show] || [];
        byShow[seat.show].push(seat);
      }

      for (const [showId, seats] of Object.entries(byShow)) {
        emitSeatUpdate(showId, seats);
        // If anyone is waiting for this category, offer it to them
        for (const seat of seats) {
          await offerSeatToNextInQueue(showId, seat.category, seat);
        }
      }
    } catch (err) {
      console.error("Hold expiry sweeper error:", err.message);
    }
  });

  console.log("⏰ Seat hold expiry sweeper started (every 15s)");
}
