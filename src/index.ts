import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env } from "./config/env";
import { errorHandler } from "./lib/errors";
import { apiKeyAuth, jwtAuth, extractJwtPayload } from "./middleware/auth";
import { rateLimit } from "./middleware/rate-limit";

// Route imports
import authRoutes from "./routes/auth.routes";
import workspaceRoutes from "./routes/workspace.routes";
import apiKeysRoutes from "./routes/api-keys.routes";
import providersRoutes from "./routes/providers.routes";
import routingRulesRoutes from "./routes/routing-rules.routes";
import emailRoutes from "./routes/email.routes";
import webhooksInboundRoutes from "./routes/webhooks-inbound.routes";
import webhooksRoutes from "./routes/webhooks.routes";
import analyticsRoutes from "./routes/analytics.routes";

// Queue workers
import { startEmailWorker } from "./queue/email.worker";
import { startWebhookWorker } from "./queue/webhook.worker";

const app = new Hono();

// ─── Global Middleware ─────────────────────────────────────
app.use("*", cors());
app.use("*", logger());
app.use("*", rateLimit());

// ─── Health Check ──────────────────────────────────────────
app.get("/", (c) => {
  return c.json({
    name: "MailMesh",
    version: "1.0.0",
    status: "operational",
    description: "Multi-vendor email gateway API",
  });
});

// ─── Public Routes (no auth) ──────────────────────────────
app.route("/auth", authRoutes);

// ─── Inbound Webhooks (provider callbacks, no auth) ───────
app.route("/webhooks/inbound", webhooksInboundRoutes);

// ─── JWT-Protected Routes (dashboard) ─────────────────────
const dashboard = new Hono();
dashboard.use("*", jwtAuth, extractJwtPayload);
dashboard.route("/workspace", workspaceRoutes);
dashboard.route("/api-keys", apiKeysRoutes);
app.route("/dashboard", dashboard);

// ─── API Key-Protected Routes (client API) ────────────────
const api = new Hono();
api.use("*", apiKeyAuth);
api.route("/providers", providersRoutes);
api.route("/routing-rules", routingRulesRoutes);
api.route("/email", emailRoutes);
api.route("/webhooks", webhooksRoutes);
api.route("/analytics", analyticsRoutes);

// ─── Error Handler ────────────────────────────────────────
app.onError(errorHandler);

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
