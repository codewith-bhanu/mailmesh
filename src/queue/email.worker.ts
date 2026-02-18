import { Worker, type Job } from "bullmq";
import { redisConnection } from "./connection";
import { db } from "../db/db-client";
import { emails } from "../db/schema";
import { eq } from "drizzle-orm";
import { routeAndSend } from "../engine/router";

interface EmailJobData {
  emailId: string;
  workspaceId: string;
}

export function startEmailWorker() {
  const worker = new Worker(
    "email-send",
    async (job: Job<EmailJobData>) => {
      const { emailId, workspaceId } = job.data;

      console.log(`[EmailWorker] Processing email ${emailId}`);

      // Update status to processing
      await db
        .update(emails)
        .set({ status: "processing" })
        .where(eq(emails.id, emailId));

      // Load email
      const [email] = await db
        .select()
        .from(emails)
        .where(eq(emails.id, emailId))
        .limit(1);

      if (!email) {
        throw new Error(`Email ${emailId} not found`);
      }

      // Route and send
      const result = await routeAndSend(email, workspaceId);

      if (result.success) {
        await db
          .update(emails)
          .set({
            status: "sent",
            provider_id: result.provider_id,
            provider_message_id: result.provider_message_id,
            sent_at: new Date(),
          })
          .where(eq(emails.id, emailId));

        console.log(
          `[EmailWorker] Email ${emailId} sent via provider ${result.provider_id}`,
        );
      } else {
        // If all retries exhausted, mark as failed
        if (job.attemptsMade >= (job.opts?.attempts || 3) - 1) {
          await db
            .update(emails)
            .set({
              status: "failed",
              error: result.error,
            })
            .where(eq(emails.id, emailId));
        }

        throw new Error(result.error || "All providers failed");
      }
    },
    {
      connection: redisConnection,
      concurrency: 10,
    },
  );

  worker.on("completed", (job) => {
    console.log(`[EmailWorker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[EmailWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
