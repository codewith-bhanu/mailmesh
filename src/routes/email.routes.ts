import { Hono } from "hono";
import { sendEmailSchema, bulkSendEmailSchema } from "../validators/email";
import * as emailService from "../services/email.service";
import { success, created } from "../lib/response";
import { AppError } from "../lib/errors";

const email = new Hono();

// POST /email/send — single send
email.post("/send", async (c) => {
  const workspaceId = c.get("workspaceId");
  const body = await c.req.json();

  // Check if bulk send
  if (body.messages && Array.isArray(body.messages)) {
    const parsed = bulkSendEmailSchema.safeParse(body);
    if (!parsed.success) {
      throw AppError.badRequest(parsed.error.issues[0].message);
    }
    const results = await emailService.bulkSendEmail(
      workspaceId,
      parsed.data.messages,
    );
    return created(c, { type: "bulk", results });
  }

  // Single send
  const parsed = sendEmailSchema.safeParse(body);
  if (!parsed.success) {
    throw AppError.badRequest(parsed.error.issues[0].message);
  }

  const result = await emailService.sendEmail(workspaceId, parsed.data);
  return created(c, result);
});

// GET /email/:id — get email status
email.get("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const emailId = c.req.param("id");
  const result = await emailService.getEmail(workspaceId, emailId);
  return success(c, result);
});

export default email;
