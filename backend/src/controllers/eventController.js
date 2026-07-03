import Event from "../models/Event.js";
import Show from "../models/Show.js";

export async function createEvent(req, res) {
  try {
    const { title, type, description, posterUrl } = req.body;
    const event = await Event.create({
      title,
      type,
      description,
      posterUrl,
      organiser: req.user._id,
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function listEvents(req, res) {
  const { type, search } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (search) filter.title = { $regex: search, $options: "i" };
  const events = await Event.find(filter).sort({ createdAt: -1 });
  res.json(events);
}

export async function getEvent(req, res) {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  const shows = await Show.find({ event: event._id }).populate("venue");
  res.json({ event, shows });
}

export async function updateEvent(req, res) {
  const event = await Event.findOneAndUpdate(
    { _id: req.params.id, organiser: req.user._id },
    req.body,
    { new: true }
  );
  if (!event) return res.status(404).json({ message: "Event not found or not yours" });
  res.json(event);
}

export async function deleteEvent(req, res) {
  await Event.findOneAndDelete({ _id: req.params.id, organiser: req.user._id });
  res.json({ message: "Event deleted" });
}
