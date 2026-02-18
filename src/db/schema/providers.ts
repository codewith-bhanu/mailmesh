import {
  pgTable,
  varchar,
  text,
  boolean,
  timestamp,
  uuid,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { workspaces } from "./workspaces";

export const providerTypeEnum = pgEnum("provider_type", [
  "brevo",
  "sendgrid",
  "mailgun",
  "ses",
  "postmark",
  "resend",
  "smtp",
]);

export const providers = pgTable("providers", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workspace_id: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  type: providerTypeEnum("type").notNull(),
  encrypted_credentials: text("encrypted_credentials").notNull(), // AES-256-GCM
  from_email: varchar("from_email", { length: 255 }),
  from_name: varchar("from_name", { length: 255 }),
  priority: integer("priority").default(0),
  daily_limit: integer("daily_limit"),
  sent_today: integer("sent_today").default(0),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at"),
});

export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;
