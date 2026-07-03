import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Venue from "../models/Venue.js";
import Event from "../models/Event.js";

async function seed() {
  await connectDB();

  // Admin
  const existingAdmin = await User.findOne({ email: "admin@ticketapp.com" });
  let admin;
  if (!existingAdmin) {
    admin = await User.create({
      name: "Admin",
      email: "admin@ticketapp.com",
      password: "Admin@123",
      role: "admin",
    });
    console.log("✅ Admin created: admin@ticketapp.com / Admin@123");
  } else {
    admin = existingAdmin;
    console.log("ℹ️  Admin already exists");
  }

  // Sample organiser
  const existingOrg = await User.findOne({ email: "organiser@ticketapp.com" });
  let organiser;
  if (!existingOrg) {
    organiser = await User.create({
      name: "Event Organiser",
      email: "organiser@ticketapp.com",
      password: "Organiser@123",
      role: "organiser",
    });
    console.log("✅ Organiser created: organiser@ticketapp.com / Organiser@123");
  } else {
    organiser = existingOrg;
    console.log("ℹ️  Organiser already exists");
  }

  // Sample venue
  const existingVenue = await Venue.findOne({ name: "Grand Arena" });
  if (!existingVenue) {
    await Venue.create({
      name: "Grand Arena",
      address: "123 Main Street, Mumbai",
      createdBy: admin._id,
      seatLayout: [
        { category: "Premium", rows: 3, cols: 10, rowLabelStart: "A" },
        { category: "Standard", rows: 5, cols: 15, rowLabelStart: "D" },
      ],
    });
    console.log("✅ Venue 'Grand Arena' created");
  } else {
    console.log("ℹ️  Venue already exists");
  }

  // Sample event
  const existingEvent = await Event.findOne({ title: "Rock Night 2025" });
  if (!existingEvent) {
    await Event.create({
      title: "Rock Night 2025",
      type: "concert",
      description: "The biggest rock concert of the year!",
      organiser: organiser._id,
    });
    console.log("✅ Event 'Rock Night 2025' created");
  } else {
    console.log("ℹ️  Event already exists");
  }

  await mongoose.disconnect();
  console.log("\n🌱 Seeding complete. Use the organiser account to create a show.");
}

seed().catch(console.error);
