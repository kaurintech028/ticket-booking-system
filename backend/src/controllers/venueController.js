import Venue from "../models/Venue.js";

export async function createVenue(req, res) {
  try {
    const { name, address, seatLayout } = req.body;
    if (!name || !seatLayout || !seatLayout.length) {
      return res.status(400).json({ message: "name and seatLayout are required" });
    }
    const venue = await Venue.create({
      name,
      address,
      seatLayout,
      createdBy: req.user._id,
    });
    res.status(201).json(venue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function listVenues(req, res) {
  const venues = await Venue.find().sort({ createdAt: -1 });
  res.json(venues);
}

export async function getVenue(req, res) {
  const venue = await Venue.findById(req.params.id);
  if (!venue) return res.status(404).json({ message: "Venue not found" });
  res.json(venue);
}

export async function updateVenue(req, res) {
  const venue = await Venue.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!venue) return res.status(404).json({ message: "Venue not found" });
  res.json(venue);
}

export async function deleteVenue(req, res) {
  await Venue.findByIdAndDelete(req.params.id);
  res.json({ message: "Venue deleted" });
}
