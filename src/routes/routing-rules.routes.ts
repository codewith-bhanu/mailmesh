import { Hono } from "hono";
import {
  createRoutingRuleSchema,
  updateRoutingRuleSchema,
} from "../validators/routing-rules";
import * as routingService from "../services/routing.service";
import { success, created } from "../lib/response";
import { AppError } from "../lib/errors";

const routingRules = new Hono();

// POST /routing-rules
routingRules.post("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const body = await c.req.json();
  const parsed = createRoutingRuleSchema.safeParse(body);

  if (!parsed.success) {
    throw AppError.badRequest(parsed.error.issues[0].message);
  }

  const result = await routingService.createRoutingRule(
    workspaceId,
    parsed.data,
  );
  return created(c, result);
});

// GET /routing-rules
routingRules.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const result = await routingService.listRoutingRules(workspaceId);
  return success(c, result);
});

// GET /routing-rules/:id
routingRules.get("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const ruleId = c.req.param("id");
  const result = await routingService.getRoutingRule(workspaceId, ruleId);
  return success(c, result);
});

// PATCH /routing-rules/:id
routingRules.patch("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const ruleId = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateRoutingRuleSchema.safeParse(body);

  if (!parsed.success) {
    throw AppError.badRequest(parsed.error.issues[0].message);
  }

  const result = await routingService.updateRoutingRule(
    workspaceId,
    ruleId,
    parsed.data,
  );
  return success(c, result);
});

// DELETE /routing-rules/:id
routingRules.delete("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const ruleId = c.req.param("id");
  const result = await routingService.deleteRoutingRule(workspaceId, ruleId);
  return success(c, result);
});

export default routingRules;
