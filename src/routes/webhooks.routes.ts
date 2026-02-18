import { Hono } from "hono";
import {
  createWebhookSchema,
  updateWebhookSchema,
} from "../validators/webhooks";
import * as webhookService from "../services/webhook.service";
import { success, created } from "../lib/response";
import { AppError } from "../lib/errors";

const webhooks = new Hono();

// POST /webhooks
webhooks.post("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const body = await c.req.json();
  const parsed = createWebhookSchema.safeParse(body);

  if (!parsed.success) {
    throw AppError.badRequest(parsed.error.issues[0].message);
  }

  const result = await webhookService.createWebhook(workspaceId, parsed.data);
  return created(c, result);
});

// GET /webhooks
webhooks.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const result = await webhookService.listWebhooks(workspaceId);
  return success(c, result);
});

// GET /webhooks/:id
webhooks.get("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const webhookId = c.req.param("id");
  const result = await webhookService.getWebhook(workspaceId, webhookId);
  return success(c, result);
});

// PATCH /webhooks/:id
webhooks.patch("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const webhookId = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateWebhookSchema.safeParse(body);

  if (!parsed.success) {
    throw AppError.badRequest(parsed.error.issues[0].message);
  }

  const result = await webhookService.updateWebhook(
    workspaceId,
    webhookId,
    parsed.data,
  );
  return success(c, result);
});

// DELETE /webhooks/:id
webhooks.delete("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const webhookId = c.req.param("id");
  const result = await webhookService.deleteWebhook(workspaceId, webhookId);
  return success(c, result);
});

export default webhooks;
