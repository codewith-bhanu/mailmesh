import { db } from "../db/db-client";
import { emails, workspaces } from "../db/schema";
import { AppError } from "../lib/errors";
import { eq, and } from "drizzle-orm";
import * as suppressionService from "./suppression.service";
import { addEmailToQueue } from "../queue/email.queue";
import type { SendEmailInput } from "../validators/email";

export async function sendEmail(workspaceId: string, input: SendEmailInput) {
  // 1. Quota check
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    throw AppError.notFound("Workspace not found");
  }

  if (
    workspace.monthly_quota &&
    workspace.used_quota !== null &&
    workspace.used_quota >= workspace.monthly_quota
  ) {
    throw AppError.tooManyRequests("Monthly email quota exceeded");
  }

  // 2. Suppression check — filter out suppressed recipients
  const allRecipients = input.to.map((r) => r.email);
  const { allowed, suppressed } = await suppressionService.filterSuppressed(
    workspaceId,
    allRecipients,
  );

  if (allowed.length === 0) {
    return {
      id: null,
      status: "suppressed",
      message: "All recipients are suppressed",
      suppressed_recipients: suppressed,
    };
  }

  // Filter the `to` list to only allowed recipients
  const filteredTo = input.to.filter((r) =>
    allowed.includes(r.email.toLowerCase()),
  );

  // 3. Create email record
  const [email] = await db
    .insert(emails)
    .values({
      workspace_id: workspaceId,
      from_email: input.from.email,
      from_name: input.from.name,
      to: filteredTo,
      cc: input.cc,
      bcc: input.bcc,
      reply_to: input.reply_to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      tags: input.tags,
      metadata: input.metadata,
      headers: input.headers,
      status: input.scheduled_at ? "scheduled" : "queued",
      scheduled_at: input.scheduled_at
        ? new Date(input.scheduled_at)
        : undefined,
    })
    .returning();

  // 4. Increment used quota
  await db
    .update(workspaces)
    .set({ used_quota: (workspace.used_quota || 0) + 1 })
    .where(eq(workspaces.id, workspaceId));

  // 5. Add to BullMQ queue
  await addEmailToQueue({
    emailId: email.id,
    workspaceId,
    scheduledAt: input.scheduled_at,
  });

  return {
    id: email.id,
    status: email.status,
    suppressed_recipients: suppressed.length > 0 ? suppressed : undefined,
  };
}

export async function bulkSendEmail(
  workspaceId: string,
  messages: SendEmailInput[],
) {
  const results = [];
  for (const msg of messages) {
    try {
      const result = await sendEmail(workspaceId, msg);
      results.push({ success: true, ...result });
    } catch (err) {
      results.push({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        subject: msg.subject,
      });
    }
  }
  return results;
}

export async function getEmail(workspaceId: string, emailId: string) {
  const [email] = await db
    .select()
    .from(emails)
    .where(and(eq(emails.id, emailId), eq(emails.workspace_id, workspaceId)))
    .limit(1);

  if (!email) {
    throw AppError.notFound("Email not found");
  }

  return email;
}
