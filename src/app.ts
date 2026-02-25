import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { errorHandler } from "./lib/errors";
import { rateLimit } from "./middleware/rate-limit";

import { HealthCheckMessage } from "./constants/app-messages";
import authRoutes from "./routes/auth.routes";
import dashboard from "./routes/dashboard.routes";
import api from "./routes/external.routes";
import webhooksInboundRoutes from "./routes/webhooks-inbound.routes";

const app = new Hono();

app.use("*", cors());
app.use("*", logger());
app.use("*", rateLimit());

app.get("/", (c) => {
  return c.json(HealthCheckMessage);
});

app.route("/auth", authRoutes);

app.route("/webhooks/inbound", webhooksInboundRoutes);

app.route("/dashboard", dashboard);

app.route("/api", api);

app.onError(errorHandler);

export default app;
