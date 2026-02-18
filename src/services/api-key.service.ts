import { db } from "../db/db-client";
import { apiKeys } from "../db/schema";
import { AppError } from "../lib/errors";
import { generateApiKey } from "../lib/api-key";
import { hashSHA256 } from "../lib/crypto";
import { eq, and } from "drizzle-orm";
import type { CreateApiKeyInput } from "../validators/api-keys";

export async function createApiKey(
  workspaceId: string,
  input: CreateApiKeyInput,
) {
  const { rawKey, prefix } = generateApiKey();
  const keyHash = hashSHA256(rawKey);

  const [key] = await db
    .insert(apiKeys)
    .values({
      workspace_id: workspaceId,
      name: input.name,
      prefix,
      key_hash: keyHash,
      expires_at: input.expires_at ? new Date(input.expires_at) : undefined,
    })
    .returning();

  return {
    id: key.id,
    name: key.name,
    prefix: key.prefix,
    key: rawKey, // shown ONLY once
    expires_at: key.expires_at,
    created_at: key.created_at,
  };
}

export async function listApiKeys(workspaceId: string) {
  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      prefix: apiKeys.prefix,
      last_used_at: apiKeys.last_used_at,
      expires_at: apiKeys.expires_at,
      is_active: apiKeys.is_active,
      created_at: apiKeys.created_at,
    })
    .from(apiKeys)
    .where(
      and(eq(apiKeys.workspace_id, workspaceId), eq(apiKeys.is_active, true)),
    );

  return keys;
}

export async function revokeApiKey(workspaceId: string, keyId: string) {
  const [key] = await db
    .update(apiKeys)
    .set({ is_active: false, revoked_at: new Date() })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.workspace_id, workspaceId)))
    .returning();

  if (!key) {
    throw AppError.notFound("API key not found");
  }

  return { id: key.id, revoked: true };
}
