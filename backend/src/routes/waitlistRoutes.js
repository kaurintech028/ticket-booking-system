import express from "express";
import {
  joinWaitlist,
  getOfferDetails,
  getMyWaitlist,
  leaveWaitlist,
} from "../controllers/waitlistController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/join", joinWaitlist);
router.get("/my", getMyWaitlist);
router.get("/offer/:entryId", getOfferDetails);
router.delete("/:entryId", leaveWaitlist);

export default router;
