import { pgTable, varchar, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { workspaces } from "./workspaces";

export const suppressionReasonEnum = pgEnum("suppression_reason", [
  "hard_bounce",
  "complaint",
  "manual",
]);

export const suppressions = pgTable("suppressions", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workspace_id: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  reason: suppressionReasonEnum("reason").notNull(),
  source_email_id: uuid("source_email_id"), // the email that triggered suppression
  created_at: timestamp("created_at").defaultNow(),
});

export type Suppression = typeof suppressions.$inferSelect;
export type NewSuppression = typeof suppressions.$inferInsert;
