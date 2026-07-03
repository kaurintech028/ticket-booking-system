import express from "express";
import {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", listEvents);
router.get("/:id", getEvent);
router.post("/", protect, requireRole("organiser"), createEvent);
router.put("/:id", protect, requireRole("organiser"), updateEvent);
router.delete("/:id", protect, requireRole("organiser"), deleteEvent);

export default router;
