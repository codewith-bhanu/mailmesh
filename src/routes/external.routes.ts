import { apiKeyAuth } from "@/middleware/auth";
import { Hono } from "hono";
import analyticsRoutes from "./analytics.routes";
import emailRoutes from "./email.routes";
import providersRoutes from "./providers.routes";
import routingRulesRoutes from "./routing-rules.routes";
import webhooksRoutes from "./webhooks.routes";

const api = new Hono();

api.use("*", apiKeyAuth);
api.route("/providers", providersRoutes);
api.route("/routing-rules", routingRulesRoutes);
api.route("/email", emailRoutes);
api.route("/webhooks", webhooksRoutes);
api.route("/analytics", analyticsRoutes);

export default api;
