import {
  pgTable,
  text,
  boolean,
  timestamp,
  varchar,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: text("password").notNull(),
  first_name: varchar("first_name", { length: 100 }),
  last_name: varchar("last_name", { length: 100 }),
  is_verified: boolean("is_verified").default(false),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at"),
  deleted_at: timestamp("deleted_at"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
