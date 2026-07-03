import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["movie", "concert"], required: true },
    description: { type: String },
    organiser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    posterUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
