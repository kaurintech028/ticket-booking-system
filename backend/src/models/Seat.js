import mongoose from "mongoose";

const seatSchema = new mongoose.Schema(
  {
    show: { type: mongoose.Schema.Types.ObjectId, ref: "Show", required: true, index: true },
    label: { type: String, required: true }, // e.g. "A1"
    category: { type: String, required: true },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["available", "held", "booked"],
      default: "available",
      index: true,
    },
    holdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    holdExpiresAt: { type: Date, default: null },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
  },
  { timestamps: true }
);

// One seat label per show must be unique
seatSchema.index({ show: 1, label: 1 }, { unique: true });

export default mongoose.model("Seat", seatSchema);
