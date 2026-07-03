import Seat from "../models/Seat.js";
import Waitlist from "../models/Waitlist.js";
import Show from "../models/Show.js";
import User from "../models/User.js";
import { emitSeatUpdate } from "../sockets/index.js";
import { scheduleOfferExpiry, cancelOfferExpiry } from "../queues/waitlistQueue.js";
import { sendWaitlistOfferEmail } from "../utils/email.js";

const OFFER_TTL_MS = (Number(process.env.WAITLIST_OFFER_TTL_MINUTES) || 15) * 60 * 1000;

/**
 * Called whenever a seat becomes free in a given category for a show
 * (cancellation, hold expiry, or a previous waitlist offer expiring).
 * Finds the next "waiting" person (FIFO by joinedAt) and offers them the seat.
 * The seat is put on "held" status (reserved for that specific user) with
 * a longer TTL window dedicated to the waitlist offer.
 */
export async function offerSeatToNextInQueue(showId, category, seat) {
  const nextEntry = await Waitlist.findOneAndUpdate(
    { show: showId, category, status: "waiting" },
    { status: "offered" },
    { sort: { joinedAt: 1 }, new: true }
  );

  if (!nextEntry) {
    // Nobody waiting -> seat just stays available
    return null;
  }

  const offerExpiresAt = new Date(Date.now() + OFFER_TTL_MS);

  // Atomically claim the seat for this waitlisted user only if it's still available
  const claimedSeat = await Seat.findOneAndUpdate(
    { _id: seat._id, status: "available" },
    {
      status: "held",
      holdBy: nextEntry.user,
      holdExpiresAt: offerExpiresAt,
    },
    { new: true }
  );

  if (!claimedSeat) {
    // Race: seat got taken some other way; revert this waitlist entry and bail
    nextEntry.status = "waiting";
    await nextEntry.save();
    return null;
  }

  nextEntry.offeredSeat = claimedSeat._id;
  nextEntry.offerExpiresAt = offerExpiresAt;
  await nextEntry.save();

  // Schedule a BullMQ delayed job to auto-expire this offer if unclaimed
  await scheduleOfferExpiry(nextEntry._id, OFFER_TTL_MS);

  // Notify the user by email with a link to complete checkout
  const user = await User.findById(nextEntry.user);
  const offerLink = `${process.env.CLIENT_URL}/checkout/offer/${nextEntry._id}`;
  await sendWaitlistOfferEmail({
    to: user.email,
    name: user.name,
    seatLabel: claimedSeat.label,
    offerLink,
    expiresInMinutes: process.env.WAITLIST_OFFER_TTL_MINUTES || 15,
  });

  emitSeatUpdate(showId, [claimedSeat]);

  return nextEntry;
}

/**
 * Called by the BullMQ worker when an offer's time window has elapsed
 * AND by the booking controller if the user explicitly declines.
 * Releases the seat and cascades the offer to the next person in line.
 */
export async function expireOfferAndCascade(waitlistEntryId) {
  const entry = await Waitlist.findById(waitlistEntryId);
  if (!entry || entry.status !== "offered") return; // already handled

  entry.status = "expired";
  await entry.save();

  const seat = await Seat.findOneAndUpdate(
    { _id: entry.offeredSeat, status: "held", holdBy: entry.user },
    { status: "available", holdBy: null, holdExpiresAt: null },
    { new: true }
  );

  if (seat) {
    emitSeatUpdate(entry.show, [seat]);
    // Cascade: offer to the NEXT person in the queue for this category
    await offerSeatToNextInQueue(entry.show, entry.category, seat);
  }
}

/** Called when the offered user successfully completes booking */
export async function fulfillOffer(waitlistEntryId) {
  const entry = await Waitlist.findById(waitlistEntryId);
  if (!entry) return;
  entry.status = "fulfilled";
  await entry.save();
  await cancelOfferExpiry(entry._id);
}
