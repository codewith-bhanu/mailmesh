import {
  pgTable,
  varchar,
  text,
  timestamp,
  uuid,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { workspaces } from "./workspaces";
import { providers } from "./providers";

export const emailStatusEnum = pgEnum("email_status", [
  "queued",
  "processing",
  "sent",
  "delivered",
  "bounced",
  "failed",
  "scheduled",
]);

export const emails = pgTable("emails", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workspace_id: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  provider_id: uuid("provider_id").references(() => providers.id, {
    onDelete: "set null",
  }),
  provider_message_id: varchar("provider_message_id", { length: 500 }),
  from_email: varchar("from_email", { length: 255 }).notNull(),
  from_name: varchar("from_name", { length: 255 }),
  to: jsonb("to").notNull().$type<Array<{ email: string; name?: string }>>(),
  cc: jsonb("cc").$type<Array<{ email: string; name?: string }>>(),
  bcc: jsonb("bcc").$type<Array<{ email: string; name?: string }>>(),
  reply_to: varchar("reply_to", { length: 255 }),
  subject: varchar("subject", { length: 998 }).notNull(),
  html: text("html"),
  text: text("text_content"),
  tags: jsonb("tags").$type<string[]>(),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  headers: jsonb("headers").$type<Record<string, string>>(),
  status: emailStatusEnum("status").default("queued").notNull(),
  attempts: jsonb("attempts")
    .default(sql`'0'`)
    .$type<number>(),
  max_retries: jsonb("max_retries")
    .default(sql`'3'`)
    .$type<number>(),
  error: text("error"),
  scheduled_at: timestamp("scheduled_at"),
  sent_at: timestamp("sent_at"),
  created_at: timestamp("created_at").defaultNow(),
});

export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
