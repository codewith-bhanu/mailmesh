import { z } from "zod";

const eventTypes = [
  "delivered",
  "bounced",
  "opened",
  "clicked",
  "complained",
  "unsubscribed",
  "deferred",
  "dropped",
] as const;

export const createWebhookSchema = z.object({
  url: z.string().url("Invalid webhook URL"),
  description: z.string().max(500).optional(),
  events: z
    .array(z.enum(eventTypes))
    .min(1, "At least one event type required"),
});

export const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  description: z.string().max(500).optional(),
  events: z.array(z.enum(eventTypes)).optional(),
  is_active: z.boolean().optional(),
});

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;
