import Show from "../models/Show.js";
import Venue from "../models/Venue.js";
import Seat from "../models/Seat.js";

/**
 * When an organiser creates a show, we immediately materialise every seat
 * from the venue's seatLayout into the Seat collection with status=available.
 * This makes per-seat status tracking, holds, and bookings simple lookups.
 *
 * Row labels: A, B, C... Col labels: 1, 2, 3...
 * So a 3-row x 5-col block starting at row "A" produces: A1-A5, B1-B5, C1-C5
 */
async function generateSeatsForShow(showId, venue, pricing) {
  const priceMap = {};
  pricing.forEach((p) => (priceMap[p.category] = p.price));

  const seats = [];
  for (const block of venue.seatLayout) {
    const startCharCode = block.rowLabelStart
      ? block.rowLabelStart.charCodeAt(0)
      : "A".charCodeAt(0);

    for (let r = 0; r < block.rows; r++) {
      const rowLabel = String.fromCharCode(startCharCode + r);
      for (let c = 1; c <= block.cols; c++) {
        seats.push({
          show: showId,
          label: `${rowLabel}${c}`,
          category: block.category,
          price: priceMap[block.category] || 0,
          status: "available",
        });
      }
    }
  }

  await Seat.insertMany(seats);
}

export async function createShow(req, res) {
  try {
    const { eventId, venueId, date, pricing } = req.body;
    if (!eventId || !venueId || !date || !pricing?.length) {
      return res
        .status(400)
        .json({ message: "eventId, venueId, date, pricing[] required" });
    }

    const venue = await Venue.findById(venueId);
    if (!venue) return res.status(404).json({ message: "Venue not found" });

    const show = await Show.create({
      event: eventId,
      venue: venueId,
      organiser: req.user._id,
      date,
      pricing,
    });

    await generateSeatsForShow(show._id, venue, pricing);

    res.status(201).json(show);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function listShows(req, res) {
  try {
    const { eventId } = req.params;
    const shows = await Show.find({ event: eventId })
      .populate("venue")
      .sort({ date: 1 });
    res.json(shows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getShow(req, res) {
  try {
    const show = await Show.findById(req.params.id)
      .populate("venue")
      .populate("event");
    if (!show) return res.status(404).json({ message: "Show not found" });
    res.json(show);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getOrganiserShows(req, res) {
  try {
    const shows = await Show.find({ organiser: req.user._id })
      .populate("event")
      .populate("venue")
      .sort({ date: -1 });
    res.json(shows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Organiser: booking summary + revenue for a show
export async function getShowRevenue(req, res) {
  try {
    const show = await Show.findOne({
      _id: req.params.id,
      organiser: req.user._id,
    });
    if (!show) return res.status(404).json({ message: "Show not found or not yours" });

    const Booking = (await import("../models/Booking.js")).default;
    const bookings = await Booking.find({ show: show._id, status: "confirmed" });
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

    const Seat = (await import("../models/Seat.js")).default;
    const seatStats = await Seat.aggregate([
      { $match: { show: show._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.json({ show, bookingsCount: bookings.length, totalRevenue, seatStats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
