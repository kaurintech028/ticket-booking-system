import express from "express";
import {
  getSeatMap,
  holdSeats,
  releaseSeats,
} from "../controllers/seatController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/show/:showId", getSeatMap);
router.post("/hold", protect, holdSeats);
router.post("/release", protect, releaseSeats);

export default router;
