import { Hono } from "hono";
import { createApiKeySchema } from "../validators/api-keys";
import * as apiKeyService from "../services/api-key.service";
import { success, created, noContent } from "../lib/response";
import { AppError } from "../lib/errors";

const apiKeys = new Hono();

// POST /api-keys
apiKeys.post("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const body = await c.req.json();
  const parsed = createApiKeySchema.safeParse(body);

  if (!parsed.success) {
    throw AppError.badRequest(parsed.error.issues[0].message);
  }

  const result = await apiKeyService.createApiKey(workspaceId, parsed.data);
  return created(c, result);
});

// GET /api-keys
apiKeys.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const result = await apiKeyService.listApiKeys(workspaceId);
  return success(c, result);
});

// DELETE /api-keys/:id
apiKeys.delete("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const keyId = c.req.param("id");
  const result = await apiKeyService.revokeApiKey(workspaceId, keyId);
  return success(c, result);
});

export default apiKeys;
