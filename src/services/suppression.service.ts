import { db } from "../db/db-client";
import { suppressions } from "../db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Check if an email address is suppressed in a workspace.
 */
export async function isSuppressed(
  workspaceId: string,
  email: string,
): Promise<boolean> {
  const [entry] = await db
    .select()
    .from(suppressions)
    .where(
      and(
        eq(suppressions.workspace_id, workspaceId),
        eq(suppressions.email, email.toLowerCase()),
      ),
    )
    .limit(1);

  return !!entry;
}

/**
 * Filter out suppressed emails from a list of recipients.
 */
export async function filterSuppressed(
  workspaceId: string,
  emails: string[],
): Promise<{ allowed: string[]; suppressed: string[] }> {
  const normalizedEmails = emails.map((e) => e.toLowerCase());
  const suppressedList = await db
    .select({ email: suppressions.email })
    .from(suppressions)
    .where(eq(suppressions.workspace_id, workspaceId));

  const suppressedSet = new Set(suppressedList.map((s) => s.email));
  const allowed: string[] = [];
  const suppressed: string[] = [];

  for (const email of normalizedEmails) {
    if (suppressedSet.has(email)) {
      suppressed.push(email);
    } else {
      allowed.push(email);
    }
  }

  return { allowed, suppressed };
}

/**
 * Add an email to the suppression list.
 */
export async function addSuppression(
  workspaceId: string,
  email: string,
  reason: "hard_bounce" | "complaint" | "manual",
  sourceEmailId?: string,
) {
  // Check if already suppressed
  const existing = await isSuppressed(workspaceId, email);
  if (existing) return;

  await db.insert(suppressions).values({
    workspace_id: workspaceId,
    email: email.toLowerCase(),
    reason,
    source_email_id: sourceEmailId,
  });
}

/**
 * Remove an email from the suppression list (manual unsuppression).
 */
export async function removeSuppression(workspaceId: string, email: string) {
  await db
    .delete(suppressions)
    .where(
      and(
        eq(suppressions.workspace_id, workspaceId),
        eq(suppressions.email, email.toLowerCase()),
      ),
    );
}

/**
 * List all suppressions for a workspace.
 */
export async function listSuppressions(workspaceId: string) {
  return db
    .select()
    .from(suppressions)
    .where(eq(suppressions.workspace_id, workspaceId));
}
