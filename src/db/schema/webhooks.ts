import {
  pgTable,
  varchar,
  text,
  boolean,
  timestamp,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { workspaces } from "./workspaces";

export const webhooks = pgTable("webhooks", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workspace_id: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  secret: text("secret").notNull(), // for HMAC-SHA256 signing
  description: varchar("description", { length: 500 }),
  events: jsonb("events")
    .notNull()
    .$type<string[]>()
    .default(sql`'["delivered","bounced","complained"]'::jsonb`),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at"),
});

export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
