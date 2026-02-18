import {
  pgTable,
  varchar,
  text,
  boolean,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { workspaces } from "./workspaces";

export const apiKeys = pgTable("api_keys", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workspace_id: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  prefix: varchar("prefix", { length: 20 }).notNull(), // e.g. "mm_live_abc1"
  key_hash: text("key_hash").notNull().unique(), // SHA-256 hash
  last_used_at: timestamp("last_used_at"),
  expires_at: timestamp("expires_at"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  revoked_at: timestamp("revoked_at"),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
