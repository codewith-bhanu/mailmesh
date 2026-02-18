import { db } from "../db/db-client";
import { emailEvents } from "../db/schema";
import { eq } from "drizzle-orm";
import type { NewEmailEvent } from "../db/schema";

/**
 * Record a normalized delivery event.
 */
export async function createEvent(data: NewEmailEvent) {
  const [event] = await db.insert(emailEvents).values(data).returning();
  return event;
}

/**
 * Get all events for an email.
 */
export async function getEventsForEmail(emailId: string) {
  return db
    .select()
    .from(emailEvents)
    .where(eq(emailEvents.email_id, emailId))
    .orderBy(emailEvents.occurred_at);
}
