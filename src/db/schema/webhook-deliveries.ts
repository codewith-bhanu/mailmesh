import {
  pgTable,
  text,
  integer,
  timestamp,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { webhooks } from "./webhooks";
import { emailEvents } from "./email-events";

export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  webhook_id: uuid("webhook_id")
    .notNull()
    .references(() => webhooks.id, { onDelete: "cascade" }),
  event_id: uuid("event_id").references(() => emailEvents.id, {
    onDelete: "set null",
  }),
  payload: jsonb("payload").notNull(),
  status_code: integer("status_code"),
  response_body: text("response_body"),
  attempts: integer("attempts").default(0),
  max_attempts: integer("max_attempts").default(5),
  next_retry_at: timestamp("next_retry_at"),
  completed_at: timestamp("completed_at"),
  created_at: timestamp("created_at").defaultNow(),
});

export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;
