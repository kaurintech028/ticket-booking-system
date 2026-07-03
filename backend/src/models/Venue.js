import mongoose from "mongoose";

// A venue defines its physical layout once. Each "block" is a category
// (e.g. Premium, Standard) with a rows x cols grid and a base price hint.
const seatBlockSchema = new mongoose.Schema({
  category: { type: String, required: true }, // e.g. "Premium", "Standard"
  rows: { type: Number, required: true },
  cols: { type: Number, required: true },
  rowLabelStart: { type: String, default: "A" }, // row naming starts here
});

const venueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // admin
    seatLayout: [seatBlockSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Venue", venueSchema);
