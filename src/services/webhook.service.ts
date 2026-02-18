import { db } from "../db/db-client";
import { webhooks, webhookDeliveries } from "../db/schema";
import { AppError } from "../lib/errors";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import type {
  CreateWebhookInput,
  UpdateWebhookInput,
} from "../validators/webhooks";

export async function createWebhook(
  workspaceId: string,
  input: CreateWebhookInput,
) {
  const secret = `whsec_${nanoid(32)}`;

  const [webhook] = await db
    .insert(webhooks)
    .values({
      workspace_id: workspaceId,
      url: input.url,
      description: input.description,
      events: input.events,
      secret,
    })
    .returning();

  return {
    ...webhook,
    secret, // shown only on creation
  };
}

export async function listWebhooks(workspaceId: string) {
  const result = await db
    .select({
      id: webhooks.id,
      url: webhooks.url,
      description: webhooks.description,
      events: webhooks.events,
      is_active: webhooks.is_active,
      created_at: webhooks.created_at,
    })
    .from(webhooks)
    .where(eq(webhooks.workspace_id, workspaceId));

  return result;
}

export async function getWebhook(workspaceId: string, webhookId: string) {
  const [webhook] = await db
    .select()
    .from(webhooks)
    .where(
      and(eq(webhooks.id, webhookId), eq(webhooks.workspace_id, workspaceId)),
    )
    .limit(1);

  if (!webhook) {
    throw AppError.notFound("Webhook not found");
  }

  // Don't expose secret in get
  const { secret, ...rest } = webhook;
  return rest;
}

export async function updateWebhook(
  workspaceId: string,
  webhookId: string,
  input: UpdateWebhookInput,
) {
  const updateData: Record<string, unknown> = { updated_at: new Date() };

  if (input.url !== undefined) updateData.url = input.url;
  if (input.description !== undefined)
    updateData.description = input.description;
  if (input.events !== undefined) updateData.events = input.events;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const [webhook] = await db
    .update(webhooks)
    .set(updateData)
    .where(
      and(eq(webhooks.id, webhookId), eq(webhooks.workspace_id, workspaceId)),
    )
    .returning();

  if (!webhook) {
    throw AppError.notFound("Webhook not found");
  }

  const { secret, ...rest } = webhook;
  return rest;
}

export async function deleteWebhook(workspaceId: string, webhookId: string) {
  const [webhook] = await db
    .delete(webhooks)
    .where(
      and(eq(webhooks.id, webhookId), eq(webhooks.workspace_id, workspaceId)),
    )
    .returning();

  if (!webhook) {
    throw AppError.notFound("Webhook not found");
  }

  return { id: webhook.id, deleted: true };
}

/**
 * Get all active webhooks for a workspace that subscribe to a given event type.
 */
export async function getWebhooksForEvent(
  workspaceId: string,
  eventType: string,
) {
  const allWebhooks = await db
    .select()
    .from(webhooks)
    .where(
      and(eq(webhooks.workspace_id, workspaceId), eq(webhooks.is_active, true)),
    );

  return allWebhooks.filter((w) => {
    const events = w.events as string[];
    return events.includes(eventType);
  });
}
