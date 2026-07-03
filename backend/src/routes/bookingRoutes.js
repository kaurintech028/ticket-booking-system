import express from "express";
import {
  confirmBooking,
  getMyBookings,
  getBooking,
  cancelBooking,
} from "../controllers/bookingController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect); // all booking routes require login

router.post("/confirm", confirmBooking);
router.get("/my", getMyBookings);
router.get("/:id", getBooking);
router.post("/:id/cancel", cancelBooking);

export default router;
