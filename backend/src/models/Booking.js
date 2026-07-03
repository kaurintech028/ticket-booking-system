import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingRef: { type: String, required: true, unique: true }, // encoded in QR
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    show: { type: mongoose.Schema.Types.ObjectId, ref: "Show", required: true },
    seats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Seat" }],
    seatLabels: [{ type: String }], // denormalized for quick display/email
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
    qrCodeDataUrl: { type: String }, // base64 data URL, sent in email
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
