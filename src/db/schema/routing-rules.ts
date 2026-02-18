import {
  pgTable,
  varchar,
  integer,
  boolean,
  timestamp,
  uuid,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { workspaces } from "./workspaces";
import { providers } from "./providers";

export const routingStrategyEnum = pgEnum("routing_strategy", [
  "priority",
  "round-robin",
  "least-used",
  "conditional",
]);

export const routingRules = pgTable("routing_rules", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workspace_id: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  strategy: routingStrategyEnum("strategy").notNull().default("priority"),
  priority: integer("priority").default(0), // rule evaluation order
  provider_id: uuid("provider_id").references(() => providers.id, {
    onDelete: "set null",
  }),
  conditions: jsonb("conditions").$type<{
    tags?: string[];
    from_email?: string;
    to_domain?: string;
    metadata?: Record<string, string>;
  }>(),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at"),
});

export type RoutingRule = typeof routingRules.$inferSelect;
export type NewRoutingRule = typeof routingRules.$inferInsert;
