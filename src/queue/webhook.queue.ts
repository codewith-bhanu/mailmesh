import { Queue } from "bullmq";
import { redisConnection } from "./connection";

export const webhookQueue = new Queue("webhook-delivery", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 10000, // 10s, 100s, 1000s, ...
    },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 2000 },
  },
});

interface WebhookJobData {
  webhookId: string;
  webhookUrl: string;
  secret: string;
  payload: Record<string, unknown>;
  deliveryId: string;
}

export async function addWebhookToQueue(data: WebhookJobData) {
  await webhookQueue.add("deliver", data);
}
