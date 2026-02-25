import app from "./app";
import { env } from "./config/env";
import { startEmailWorker } from "./queue/email.worker";
import { startWebhookWorker } from "./queue/webhook.worker";

// ─── Start Workers ────────────────────────────────────────
try {
  startEmailWorker();
  startWebhookWorker();
  console.log("📧 BullMQ workers started");
} catch (err) {
  console.warn(
    "⚠️  BullMQ workers could not start (Redis may not be running):",
    err,
  );
}

console.log(`🚀 MailMesh running on port ${env.PORT}`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
