import { Hono } from "hono";
import {
  createProviderSchema,
  updateProviderSchema,
} from "../validators/providers";
import * as providerService from "../services/provider.service";
import { success, created, noContent } from "../lib/response";
import { AppError } from "../lib/errors";

const providers = new Hono();

// POST /providers
providers.post("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const body = await c.req.json();
  const parsed = createProviderSchema.safeParse(body);

  if (!parsed.success) {
    throw AppError.badRequest(parsed.error.issues[0].message);
  }

  const result = await providerService.createProvider(workspaceId, parsed.data);
  return created(c, result);
});

// GET /providers
providers.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const result = await providerService.listProviders(workspaceId);
  return success(c, result);
});

// GET /providers/:id
providers.get("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const providerId = c.req.param("id");
  const result = await providerService.getProvider(workspaceId, providerId);
  return success(c, result);
});

// PATCH /providers/:id
providers.patch("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const providerId = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateProviderSchema.safeParse(body);

  if (!parsed.success) {
    throw AppError.badRequest(parsed.error.issues[0].message);
  }

  const result = await providerService.updateProvider(
    workspaceId,
    providerId,
    parsed.data,
  );
  return success(c, result);
});

// DELETE /providers/:id
providers.delete("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const providerId = c.req.param("id");
  const result = await providerService.deleteProvider(workspaceId, providerId);
  return success(c, result);
});

export default providers;
