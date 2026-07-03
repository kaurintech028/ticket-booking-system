import Seat from "../models/Seat.js";
import { emitSeatUpdate } from "../sockets/index.js";

const HOLD_TTL_MS =
  (Number(process.env.SEAT_HOLD_TTL_MINUTES) || 10) * 60 * 1000;

/**
 * GET /api/seats/show/:showId
 * Returns all seats for a show with current status.
 * Frontend uses this to render the visual seat map on load.
 * After load, real-time updates come via Socket.io (seat:update events).
 */
export async function getSeatMap(req, res) {
  try {
    const seats = await Seat.find({ show: req.params.showId }).sort({
      category: 1,
      label: 1,
    });
    res.json(seats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * POST /api/seats/hold
 * Body: { showId, seatIds: [...] }
 *
 * CONCURRENCY PROTECTION:
 * Uses MongoDB's atomic findOneAndUpdate with a filter on status='available'.
 * Only ONE request can win the race for any given seat — all others receive
 * a null result and get a 409. No locks, no transactions needed.
 *
 * Also handles the edge case where a hold expired *while* this request is
 * in flight: the filter `holdExpiresAt <= now OR status=available` reclaims
 * stale holds atomically too.
 */
export async function holdSeats(req, res) {
  try {
    const { showId, seatIds } = req.body;
    if (!showId || !seatIds?.length) {
      return res
        .status(400)
        .json({ message: "showId and seatIds[] required" });
    }

    const holdExpiresAt = new Date(Date.now() + HOLD_TTL_MS);
    const heldSeats = [];
    const failedSeats = [];

    // Process each seat atomically. We do NOT use a single bulkWrite here
    // because we need to check per-seat success/failure.
    for (const seatId of seatIds) {
      const now = new Date();
      const seat = await Seat.findOneAndUpdate(
        {
          _id: seatId,
          show: showId,
          // Win the race: seat must be available OR its hold has already expired
          $or: [
            { status: "available" },
            { status: "held", holdExpiresAt: { $lte: now } },
          ],
        },
        {
          status: "held",
          holdBy: req.user._id,
          holdExpiresAt,
        },
        { new: true }
      );

      if (seat) {
        heldSeats.push(seat);
      } else {
        failedSeats.push(seatId);
      }
    }

    // If any seat couldn't be held, roll back all the ones we just held
    if (failedSeats.length > 0) {
      const rollbackIds = heldSeats.map((s) => s._id);
      if (rollbackIds.length > 0) {
        const rolledBack = await Seat.find({ _id: { $in: rollbackIds } });
        await Seat.updateMany(
          { _id: { $in: rollbackIds }, holdBy: req.user._id },
          { status: "available", holdBy: null, holdExpiresAt: null }
        );
        emitSeatUpdate(showId, rolledBack.map((s) => ({
          ...s.toObject(),
          status: "available",
          holdBy: null,
          holdExpiresAt: null,
        })));
      }
      return res.status(409).json({
        message: "One or more seats are no longer available",
        failedSeatIds: failedSeats,
      });
    }

    emitSeatUpdate(showId, heldSeats);

    res.json({
      message: "Seats held successfully",
      seats: heldSeats,
      holdExpiresAt,
      holdTTLSeconds: HOLD_TTL_MS / 1000,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * POST /api/seats/release
 * Body: { showId, seatIds: [...] }
 * Explicit release when customer cancels from the checkout page (optional;
 * TTL sweeper will also catch it automatically).
 */
export async function releaseSeats(req, res) {
  try {
    const { showId, seatIds } = req.body;
    const seats = await Seat.find({
      _id: { $in: seatIds },
      show: showId,
      holdBy: req.user._id,
      status: "held",
    });

    if (!seats.length) {
      return res
        .status(404)
        .json({ message: "No held seats found for this user" });
    }

    await Seat.updateMany(
      { _id: { $in: seats.map((s) => s._id) } },
      { status: "available", holdBy: null, holdExpiresAt: null }
    );

    const updatedSeats = seats.map((s) => ({
      ...s.toObject(),
      status: "available",
      holdBy: null,
      holdExpiresAt: null,
    }));

    emitSeatUpdate(showId, updatedSeats);

    // Cascade to waitlist for each released seat's category
    const { offerSeatToNextInQueue } = await import(
      "../services/waitlistService.js"
    );
    for (const seat of seats) {
      const freshSeat = await Seat.findById(seat._id);
      if (freshSeat) {
        await offerSeatToNextInQueue(showId, seat.category, freshSeat);
      }
    }

    res.json({ message: "Seats released", count: seats.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
