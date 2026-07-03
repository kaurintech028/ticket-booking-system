import Waitlist from "../models/Waitlist.js";
import Seat from "../models/Seat.js";
import Show from "../models/Show.js";

/**
 * POST /api/waitlist/join
 * Body: { showId, category }
 * Customer joins the waitlist for a category when event is sold out.
 */
export async function joinWaitlist(req, res) {
  try {
    const { showId, category } = req.body;
    if (!showId || !category) {
      return res.status(400).json({ message: "showId and category required" });
    }

    // Check there's actually no available seat (prevent abuse)
    const available = await Seat.findOne({
      show: showId,
      category,
      status: "available",
    });
    if (available) {
      return res.status(400).json({
        message: "Seats are still available in this category. No need to join waitlist.",
      });
    }

    // Check if user already has an active entry
    const existing = await Waitlist.findOne({
      show: showId,
      category,
      user: req.user._id,
      status: { $in: ["waiting", "offered"] },
    });
    if (existing) {
      return res.status(409).json({
        message: "You are already on the waitlist for this category",
        entry: existing,
      });
    }

    const entry = await Waitlist.create({
      show: showId,
      category,
      user: req.user._id,
    });

    // Queue position (1-based)
    const position = await Waitlist.countDocuments({
      show: showId,
      category,
      status: "waiting",
      joinedAt: { $lte: entry.joinedAt },
    });

    res.status(201).json({ entry, position });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * GET /api/waitlist/offer/:entryId
 * Returns details of a waitlist offer so the customer can complete checkout.
 * Used by the offer link sent in email.
 */
export async function getOfferDetails(req, res) {
  try {
    const entry = await Waitlist.findOne({
      _id: req.params.entryId,
      user: req.user._id,
      status: "offered",
    }).populate("offeredSeat");

    if (!entry) {
      return res.status(404).json({
        message: "Offer not found or already expired",
      });
    }

    if (entry.offerExpiresAt < new Date()) {
      return res.status(410).json({ message: "This offer has expired" });
    }

    const show = await Show.findById(entry.show)
      .populate("event")
      .populate("venue");

    res.json({
      entry,
      seat: entry.offeredSeat,
      show,
      timeLeftMs: entry.offerExpiresAt - new Date(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * GET /api/waitlist/my
 * Returns all waitlist entries for the current user.
 */
export async function getMyWaitlist(req, res) {
  try {
    const entries = await Waitlist.find({ user: req.user._id })
      .populate({ path: "show", populate: [{ path: "event" }, { path: "venue" }] })
      .populate("offeredSeat")
      .sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * DELETE /api/waitlist/:entryId
 * Customer leaves the waitlist voluntarily.
 */
export async function leaveWaitlist(req, res) {
  try {
    const entry = await Waitlist.findOneAndUpdate(
      { _id: req.params.entryId, user: req.user._id, status: "waiting" },
      { status: "cancelled" },
      { new: true }
    );
    if (!entry) return res.status(404).json({ message: "Waitlist entry not found" });
    res.json({ message: "Left waitlist successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
