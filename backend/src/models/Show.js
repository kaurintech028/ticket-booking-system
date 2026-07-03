import mongoose from "mongoose";

const pricingSchema = new mongoose.Schema({
  category: { type: String, required: true },
  price: { type: Number, required: true },
});

const showSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    venue: { type: mongoose.Schema.Types.ObjectId, ref: "Venue", required: true },
    organiser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    pricing: [pricingSchema], // per-category pricing for this show
  },
  { timestamps: true }
);

export default mongoose.model("Show", showSchema);
