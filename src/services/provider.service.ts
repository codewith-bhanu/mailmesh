import { db } from "../db/db-client";
import { providers } from "../db/schema";
import { AppError } from "../lib/errors";
import { encrypt, decrypt } from "../lib/crypto";
import { eq, and } from "drizzle-orm";
import type {
  CreateProviderInput,
  UpdateProviderInput,
} from "../validators/providers";

export async function createProvider(
  workspaceId: string,
  input: CreateProviderInput,
) {
  const encryptedCredentials = encrypt(JSON.stringify(input.credentials));

  const [provider] = await db
    .insert(providers)
    .values({
      workspace_id: workspaceId,
      name: input.name,
      type: input.type,
      encrypted_credentials: encryptedCredentials,
      from_email: input.from_email,
      from_name: input.from_name,
      priority: input.priority,
      daily_limit: input.daily_limit,
    })
    .returning();

  return sanitizeProvider(provider);
}

export async function listProviders(workspaceId: string) {
  const result = await db
    .select()
    .from(providers)
    .where(eq(providers.workspace_id, workspaceId));

  return result.map(sanitizeProvider);
}

export async function getProvider(workspaceId: string, providerId: string) {
  const [provider] = await db
    .select()
    .from(providers)
    .where(
      and(
        eq(providers.id, providerId),
        eq(providers.workspace_id, workspaceId),
      ),
    )
    .limit(1);

  if (!provider) {
    throw AppError.notFound("Provider not found");
  }

  return sanitizeProvider(provider);
}

export async function getProviderWithCredentials(
  workspaceId: string,
  providerId: string,
) {
  const [provider] = await db
    .select()
    .from(providers)
    .where(
      and(
        eq(providers.id, providerId),
        eq(providers.workspace_id, workspaceId),
      ),
    )
    .limit(1);

  if (!provider) {
    throw AppError.notFound("Provider not found");
  }

  return {
    ...provider,
    decrypted_credentials: JSON.parse(decrypt(provider.encrypted_credentials)),
  };
}

export async function updateProvider(
  workspaceId: string,
  providerId: string,
  input: UpdateProviderInput,
) {
  const updateData: Record<string, unknown> = { updated_at: new Date() };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.from_email !== undefined) updateData.from_email = input.from_email;
  if (input.from_name !== undefined) updateData.from_name = input.from_name;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.daily_limit !== undefined)
    updateData.daily_limit = input.daily_limit;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;
  if (input.credentials) {
    updateData.encrypted_credentials = encrypt(
      JSON.stringify(input.credentials),
    );
  }

  const [provider] = await db
    .update(providers)
    .set(updateData)
    .where(
      and(
        eq(providers.id, providerId),
        eq(providers.workspace_id, workspaceId),
      ),
    )
    .returning();

  if (!provider) {
    throw AppError.notFound("Provider not found");
  }

  return sanitizeProvider(provider);
}

export async function deleteProvider(workspaceId: string, providerId: string) {
  const [provider] = await db
    .delete(providers)
    .where(
      and(
        eq(providers.id, providerId),
        eq(providers.workspace_id, workspaceId),
      ),
    )
    .returning();

  if (!provider) {
    throw AppError.notFound("Provider not found");
  }

  return { id: provider.id, deleted: true };
}

function sanitizeProvider(provider: typeof providers.$inferSelect) {
  const { encrypted_credentials, ...rest } = provider;
  return { ...rest, credentials_configured: true };
}
