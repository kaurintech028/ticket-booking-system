import Booking from "../models/Booking.js";
import Seat from "../models/Seat.js";
import Waitlist from "../models/Waitlist.js";
import Show from "../models/Show.js";
import { generateQrCode } from "../utils/qrcode.js";
import { generateBookingRef } from "../utils/bookingRef.js";
import {
  sendBookingConfirmationEmail,
  sendCancellationEmail,
} from "../utils/email.js";
import { emitSeatUpdate } from "../sockets/index.js";
import { offerSeatToNextInQueue } from "../services/waitlistService.js";
import { fulfillOffer } from "../services/waitlistService.js";

/**
 * POST /api/bookings/confirm
 * Body: { showId, seatIds[], waitlistEntryId? }
 *
 * Steps:
 * 1. Verify every seat is currently held by THIS user (prevents others from sneaking in).
 * 2. Atomically flip all seats to "booked".
 * 3. Generate booking ref + QR code.
 * 4. Persist booking record.
 * 5. Send confirmation email with QR.
 * 6. If booking came from a waitlist offer, mark that entry as fulfilled.
 */
export async function confirmBooking(req, res) {
  try {
    const { showId, seatIds, waitlistEntryId } = req.body;
    if (!showId || !seatIds?.length) {
      return res
        .status(400)
        .json({ message: "showId and seatIds[] are required" });
    }

    // 1. Verify all seats are held by this user and not yet expired
    const now = new Date();
    const seats = await Seat.find({
      _id: { $in: seatIds },
      show: showId,
      status: "held",
      holdBy: req.user._id,
      holdExpiresAt: { $gt: now }, // hold must still be live
    });

    if (seats.length !== seatIds.length) {
      return res.status(409).json({
        message:
          "One or more seats are no longer held by you or hold has expired. Please restart seat selection.",
      });
    }

    const totalAmount = seats.reduce((sum, s) => sum + s.price, 0);
    const bookingRef = generateBookingRef();
    const qrCodeDataUrl = await generateQrCode(bookingRef);

    // 2. Create booking record first so we have the ID
    const booking = await Booking.create({
      bookingRef,
      user: req.user._id,
      show: showId,
      seats: seats.map((s) => s._id),
      seatLabels: seats.map((s) => s.label),
      totalAmount,
      qrCodeDataUrl,
    });

    // 3. Atomically flip seats to booked
    await Seat.updateMany(
      { _id: { $in: seats.map((s) => s._id) } },
      {
        status: "booked",
        holdBy: null,
        holdExpiresAt: null,
        bookingId: booking._id,
      }
    );

    const bookedSeats = await Seat.find({ _id: { $in: seats.map((s) => s._id) } });
    emitSeatUpdate(showId, bookedSeats);

    // 4. Mark waitlist entry as fulfilled if this was a waitlist offer
    if (waitlistEntryId) {
      await fulfillOffer(waitlistEntryId);
    }

    // 5. Send confirmation email (non-blocking — don't fail booking if email fails)
    const show = await Show.findById(showId).populate("event");
    sendBookingConfirmationEmail({
      to: req.user.email,
      name: req.user.name,
      show,
      seatLabels: booking.seatLabels,
      bookingRef,
      qrCodeDataUrl,
    }).catch((err) => console.error("Email send failed:", err.message));

    res.status(201).json({ booking, qrCodeDataUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * GET /api/bookings/my
 * Returns current user's booking history.
 */
export async function getMyBookings(req, res) {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({
        path: "show",
        populate: [{ path: "event" }, { path: "venue" }],
      })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * GET /api/bookings/:id
 */
export async function getBooking(req, res) {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate({ path: "show", populate: [{ path: "event" }, { path: "venue" }] });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * POST /api/bookings/:id/cancel
 *
 * Steps:
 * 1. Flip booking to cancelled.
 * 2. Release all its seats back to available.
 * 3. Send cancellation email.
 * 4. For each released seat, offer to next person in waitlist queue.
 */
export async function cancelBooking(req, res) {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: "confirmed",
    });

    if (!booking) {
      return res
        .status(404)
        .json({ message: "Booking not found or already cancelled" });
    }

    booking.status = "cancelled";
    await booking.save();

    // Release seats
    await Seat.updateMany(
      { _id: { $in: booking.seats } },
      { status: "available", holdBy: null, holdExpiresAt: null, bookingId: null }
    );

    const releasedSeats = await Seat.find({ _id: { $in: booking.seats } });
    emitSeatUpdate(String(booking.show), releasedSeats);

    // Send cancellation email (non-blocking)
    sendCancellationEmail({
      to: req.user.email,
      name: req.user.name,
      bookingRef: booking.bookingRef,
    }).catch((err) => console.error("Cancellation email failed:", err.message));

    // Offer each released seat to the next person in the waitlist
    for (const seat of releasedSeats) {
      await offerSeatToNextInQueue(String(booking.show), seat.category, seat);
    }

    res.json({ message: "Booking cancelled successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
