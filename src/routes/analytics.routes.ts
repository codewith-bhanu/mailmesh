import { Hono } from "hono";
import * as analyticsService from "../services/analytics.service";
import { success } from "../lib/response";

const analytics = new Hono();

// GET /analytics
analytics.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const result = await analyticsService.getWorkspaceAnalytics(workspaceId);
  return success(c, result);
});

// GET /analytics/providers
analytics.get("/providers", async (c) => {
  const workspaceId = c.get("workspaceId");
  const result = await analyticsService.getProviderAnalytics(workspaceId);
  return success(c, result);
});

export default analytics;
