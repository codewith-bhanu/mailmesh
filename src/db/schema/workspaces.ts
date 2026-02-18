import {
  pgTable,
  varchar,
  integer,
  boolean,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const workspaces = pgTable("workspaces", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  plan: varchar("plan", { length: 50 }).default("free"),
  monthly_quota: integer("monthly_quota").default(1000),
  used_quota: integer("used_quota").default(0),
  quota_reset_at: timestamp("quota_reset_at").default(
    sql`DATE_TRUNC('month', NOW()) + INTERVAL '1 month'`,
  ),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at"),
});

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
