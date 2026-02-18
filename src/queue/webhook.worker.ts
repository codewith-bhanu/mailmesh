import { Worker, type Job } from "bullmq";
import { redisConnection } from "./connection";
import { db } from "../db/db-client";
import { webhookDeliveries } from "../db/schema";
import { eq } from "drizzle-orm";
import { signHMAC } from "../lib/crypto";

interface WebhookJobData {
  webhookId: string;
  webhookUrl: string;
  secret: string;
  payload: Record<string, unknown>;
  deliveryId: string;
}

export function startWebhookWorker() {
  const worker = new Worker(
    "webhook-delivery",
    async (job: Job<WebhookJobData>) => {
      const { webhookUrl, secret, payload, deliveryId } = job.data;

      const payloadStr = JSON.stringify(payload);
      const timestamp = Date.now().toString();
      const signature = signHMAC(`${timestamp}.${payloadStr}`, secret);

      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-MailMesh-Signature": signature,
            "X-MailMesh-Timestamp": timestamp,
          },
          body: payloadStr,
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        const responseBody = await response.text().catch(() => "");

        await db
          .update(webhookDeliveries)
          .set({
            status_code: response.status,
            response_body: responseBody.slice(0, 1000),
            attempts: job.attemptsMade + 1,
            ...(response.ok ? { completed_at: new Date() } : {}),
          })
          .where(eq(webhookDeliveries.id, deliveryId));

        if (!response.ok) {
          throw new Error(`Webhook returned ${response.status}`);
        }

        console.log(`[WebhookWorker] Delivered to ${webhookUrl}`);
      } catch (err) {
        await db
          .update(webhookDeliveries)
          .set({
            attempts: job.attemptsMade + 1,
            next_retry_at: new Date(
              Date.now() + Math.pow(10, job.attemptsMade + 1) * 1000,
            ),
          })
          .where(eq(webhookDeliveries.id, deliveryId));

        throw err; // Let BullMQ retry
      }
    },
    {
      connection: redisConnection,
      concurrency: 5,
    },
  );

  worker.on("failed", (job, err) => {
    console.error(`[WebhookWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
