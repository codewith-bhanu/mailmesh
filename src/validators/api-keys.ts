import { z } from "zod";

export const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  expires_at: z.string().optional(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
