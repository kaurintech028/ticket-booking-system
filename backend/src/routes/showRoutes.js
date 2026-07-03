import express from "express";
import {
  createShow,
  listShows,
  getShow,
  getOrganiserShows,
  getShowRevenue,
} from "../controllers/showController.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/organiser/my-shows", protect, requireRole("organiser"), getOrganiserShows);
router.get("/organiser/:id/revenue", protect, requireRole("organiser"), getShowRevenue);
router.get("/event/:eventId", listShows);
router.get("/:id", getShow);
router.post("/", protect, requireRole("organiser"), createShow);

export default router;
