import mongoose from "mongoose";

const waitlistSchema = new mongoose.Schema(
  {
    show: { type: mongoose.Schema.Types.ObjectId, ref: "Show", required: true, index: true },
    category: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["waiting", "offered", "fulfilled", "expired", "cancelled"],
      default: "waiting",
      index: true,
    },
    joinedAt: { type: Date, default: Date.now }, // determines queue order (FIFO)
    offeredSeat: { type: mongoose.Schema.Types.ObjectId, ref: "Seat", default: null },
    offerExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// A user can only have one active waitlist entry per show+category
waitlistSchema.index(
  { show: 1, category: 1, user: 1, status: 1 },
  { unique: false }
);

export default mongoose.model("Waitlist", waitlistSchema);
