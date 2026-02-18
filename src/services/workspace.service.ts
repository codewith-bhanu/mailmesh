import { db } from "../db/db-client";
import { workspaces } from "../db/schema";
import { AppError } from "../lib/errors";
import { eq } from "drizzle-orm";

export async function getWorkspace(workspaceId: string) {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    throw AppError.notFound("Workspace not found");
  }

  return workspace;
}

export async function updateWorkspace(
  workspaceId: string,
  data: { name?: string; slug?: string },
) {
  // If slug is being updated, check uniqueness
  if (data.slug) {
    const [existing] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.slug, data.slug))
      .limit(1);

    if (existing && existing.id !== workspaceId) {
      throw AppError.conflict("Slug is already taken");
    }
  }

  const [updated] = await db
    .update(workspaces)
    .set({ ...data, updated_at: new Date() })
    .where(eq(workspaces.id, workspaceId))
    .returning();

  if (!updated) {
    throw AppError.notFound("Workspace not found");
  }

  return updated;
}
