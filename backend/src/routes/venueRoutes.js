import express from "express";
import {
  createVenue,
  listVenues,
  getVenue,
  updateVenue,
  deleteVenue,
} from "../controllers/venueController.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", listVenues); // public browse
router.get("/:id", getVenue);
router.post("/", protect, requireRole("admin"), createVenue);
router.put("/:id", protect, requireRole("admin"), updateVenue);
router.delete("/:id", protect, requireRole("admin"), deleteVenue);

export default router;
