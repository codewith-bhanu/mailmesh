import { Hono } from "hono";
import * as workspaceService from "../services/workspace.service";
import { success } from "../lib/response";
import { AppError } from "../lib/errors";

const workspace = new Hono();

// GET /workspace
workspace.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const result = await workspaceService.getWorkspace(workspaceId);
  return success(c, result);
});

// PATCH /workspace
workspace.patch("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const body = await c.req.json();

  if (!body.name && !body.slug) {
    throw AppError.badRequest("At least one field (name or slug) is required");
  }

  const result = await workspaceService.updateWorkspace(workspaceId, body);
  return success(c, result);
});

export default workspace;
