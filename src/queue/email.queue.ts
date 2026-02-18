import { Queue } from "bullmq";
import { redisConnection } from "./connection";

export const emailQueue = new Queue("email-send", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, // 5s, 25s, 125s
    },
    removeOnComplete: { count: 1000 }, // keep last 1000
    removeOnFail: { count: 5000 },
  },
});

interface EmailJobData {
  emailId: string;
  workspaceId: string;
  scheduledAt?: string;
}

export async function addEmailToQueue(data: EmailJobData) {
  const opts: Record<string, unknown> = {};

  if (data.scheduledAt) {
    const delay = new Date(data.scheduledAt).getTime() - Date.now();
    if (delay > 0) {
      opts.delay = delay;
    }
  }

  await emailQueue.add("send", data, opts);
}
