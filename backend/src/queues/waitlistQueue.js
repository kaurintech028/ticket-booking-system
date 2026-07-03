import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

// Delayed job: fires exactly when a waitlist offer's time-limited window expires.
// jobId = waitlist entry's _id, so we can find/cancel it precisely.
export const waitlistOfferQueue = new Queue("waitlist-offer-expiry", {
  connection: redisConnection,
});

export async function scheduleOfferExpiry(waitlistEntryId, delayMs) {
  // Remove any existing job for this entry first (avoids duplicates on re-offer)
  const existing = await waitlistOfferQueue.getJob(String(waitlistEntryId));
  if (existing) await existing.remove();

  await waitlistOfferQueue.add(
    "expire-offer",
    { waitlistEntryId: String(waitlistEntryId) },
    {
      jobId: String(waitlistEntryId),
      delay: delayMs,
      removeOnComplete: true,
      removeOnFail: true,
    }
  );
}

export async function cancelOfferExpiry(waitlistEntryId) {
  const existing = await waitlistOfferQueue.getJob(String(waitlistEntryId));
  if (existing) await existing.remove();
}
