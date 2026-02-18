import { z } from "zod";

const providerTypes = [
  "brevo",
  "sendgrid",
  "mailgun",
  "ses",
  "postmark",
  "resend",
  "smtp",
] as const;

const smtpCredentials = z.object({
  host: z.string(),
  port: z.number(),
  secure: z.boolean().default(true),
  username: z.string(),
  password: z.string(),
});

const apiCredentials = z.object({
  api_key: z.string().min(1),
});

const sesCredentials = z.object({
  access_key_id: z.string(),
  secret_access_key: z.string(),
  region: z.string().default("us-east-1"),
});

export const createProviderSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(providerTypes),
  credentials: z.union([apiCredentials, sesCredentials, smtpCredentials]),
  from_email: z.email().optional(),
  from_name: z.string().max(255).optional(),
  priority: z.number().int().min(0).default(0),
  daily_limit: z.number().int().positive().optional(),
});

export const updateProviderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  credentials: z
    .union([apiCredentials, sesCredentials, smtpCredentials])
    .optional(),
  from_email: z.email().optional(),
  from_name: z.string().max(255).optional(),
  priority: z.number().int().min(0).optional(),
  daily_limit: z.number().int().positive().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
