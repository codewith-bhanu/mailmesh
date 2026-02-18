import type { Context, Next } from "hono";
import { jwt } from "hono/jwt";
import { db } from "../db/db-client";
import { apiKeys } from "../db/schema";
import { hashSHA256 } from "../lib/crypto";
import { AppError } from "../lib/errors";
import { env } from "../config/env";
import { eq, and, isNull } from "drizzle-orm";

// Extend Hono context variables
declare module "hono" {
  interface ContextVariableMap {
    workspaceId: string;
    apiKeyId: string;
    userId: string;
  }
}

/**
 * API Key authentication middleware.
 * Expects: Authorization: Bearer mm_live_xxxxx
 */
export async function apiKeyAuth(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    throw AppError.unauthorized("Missing or invalid Authorization header");
  }

  const rawKey = authHeader.slice(7); // Remove "Bearer "
  //   if (!rawKey.startsWith("mm_live_")) {
  //     throw AppError.unauthorized("Invalid API key format");
  //   }

  const keyHash = hashSHA256(rawKey);

  const [key] = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.key_hash, keyHash),
        eq(apiKeys.is_active, true),
        isNull(apiKeys.revoked_at),
      ),
    )
    .limit(1);

  console.log("Key", key);

  if (!key) {
    throw AppError.unauthorized("Invalid or revoked API key");
  }

  // Check expiration
  if (key.expires_at && key.expires_at < new Date()) {
    throw AppError.unauthorized("API key has expired");
  }

  // Update last_used_at (fire and forget)
  db.update(apiKeys)
    .set({ last_used_at: new Date() })
    .where(eq(apiKeys.id, key.id))
    .execute()
    .catch(() => {}); // non-blocking

  c.set("workspaceId", key.workspace_id);
  c.set("apiKeyId", key.id);

  await next();
}

/**
 * JWT authentication middleware for dashboard routes.
 * Uses Hono's built-in hono/jwt with Web Crypto API.
 */
export const jwtAuth = jwt({
  secret: env.JWT_SECRET,
  alg: "HS256",
});

/**
 * Post-JWT middleware to extract userId and workspaceId from the verified payload.
 * Use after jwtAuth: dashboard.use("*", jwtAuth, extractJwtPayload);
 */
export async function extractJwtPayload(c: Context, next: Next) {
  const payload = c.get("jwtPayload") as {
    userId: string;
    workspaceId: string;
  };

  if (!payload?.userId || !payload?.workspaceId) {
    throw AppError.unauthorized("Invalid token payload");
  }

  c.set("userId", payload.userId);
  c.set("workspaceId", payload.workspaceId);

  await next();
}
