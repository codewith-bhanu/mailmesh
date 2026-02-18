import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { emails } from "./emails";

export const eventTypeEnum = pgEnum("event_type", [
  "delivered",
  "bounced",
  "opened",
  "clicked",
  "complained",
  "unsubscribed",
  "deferred",
  "dropped",
]);

export const emailEvents = pgTable("email_events", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email_id: uuid("email_id")
    .notNull()
    .references(() => emails.id, { onDelete: "cascade" }),
  event_type: eventTypeEnum("event_type").notNull(),
  provider_event_id: text("provider_event_id"),
  recipient: text("recipient"),
  raw_payload: jsonb("raw_payload"),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  occurred_at: timestamp("occurred_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
});

export type EmailEvent = typeof emailEvents.$inferSelect;
export type NewEmailEvent = typeof emailEvents.$inferInsert;
