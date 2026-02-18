import { z } from "zod";

const recipientSchema = z.object({
  email: z.email(),
  name: z.string().optional(),
});

export const sendEmailSchema = z
  .object({
    from: z.object({
      email: z.email(),
      name: z.string().optional(),
    }),
    to: z.array(recipientSchema).min(1, "At least one recipient is required"),
    cc: z.array(recipientSchema).optional(),
    bcc: z.array(recipientSchema).optional(),
    reply_to: z.email().optional(),
    subject: z.string().min(1).max(998),
    html: z.string().optional(),
    text: z.string().optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.string()).optional(),
    headers: z.record(z.string(), z.string()).optional(),
    scheduled_at: z.string().optional(),
  })
  .refine((data) => data.html || data.text, {
    message: "Either html or text content is required",
  });

export const bulkSendEmailSchema = z.object({
  messages: z.array(sendEmailSchema).min(1).max(100),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type BulkSendEmailInput = z.infer<typeof bulkSendEmailSchema>;
