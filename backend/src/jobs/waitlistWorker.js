import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { expireOfferAndCascade } from "../services/waitlistService.js";

export function startWaitlistWorker() {
  const worker = new Worker(
    "waitlist-offer-expiry",
    async (job) => {
      const { waitlistEntryId } = job.data;
      await expireOfferAndCascade(waitlistEntryId);
    },
    { connection: redisConnection }
  );

  worker.on("completed", (job) => {
    console.log(`✅ Waitlist offer-expiry job ${job.id} processed`);
  });
  worker.on("failed", (job, err) => {
    console.error(`❌ Waitlist offer-expiry job ${job?.id} failed:`, err.message);
  });

  return worker;
}
