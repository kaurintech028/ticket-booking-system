import { v4 as uuidv4 } from "uuid";

export function generateBookingRef() {
  return "BK-" + uuidv4().split("-")[0].toUpperCase();
}
