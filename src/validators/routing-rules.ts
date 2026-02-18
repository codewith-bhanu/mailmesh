import { z } from "zod";

const strategies = [
  "priority",
  "round-robin",
  "least-used",
  "conditional",
] as const;

export const createRoutingRuleSchema = z.object({
  name: z.string().min(1).max(255),
  strategy: z.enum(strategies),
  priority: z.number().int().min(0).default(0),
  provider_id: z.uuid().optional(),
  conditions: z
    .object({
      tags: z.array(z.string()).optional(),
      from_email: z.email().optional(),
      to_domain: z.string().optional(),
      metadata: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
});

export const updateRoutingRuleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  strategy: z.enum(strategies).optional(),
  priority: z.number().int().min(0).optional(),
  provider_id: z.uuid().nullable().optional(),
  conditions: z
    .object({
      tags: z.array(z.string()).optional(),
      from_email: z.email().optional(),
      to_domain: z.string().optional(),
      metadata: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  is_active: z.boolean().optional(),
});

export type CreateRoutingRuleInput = z.infer<typeof createRoutingRuleSchema>;
export type UpdateRoutingRuleInput = z.infer<typeof updateRoutingRuleSchema>;
