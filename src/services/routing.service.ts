import { db } from "../db/db-client";
import { routingRules } from "../db/schema";
import { AppError } from "../lib/errors";
import { eq, and } from "drizzle-orm";
import type {
  CreateRoutingRuleInput,
  UpdateRoutingRuleInput,
} from "../validators/routing-rules";

export async function createRoutingRule(
  workspaceId: string,
  input: CreateRoutingRuleInput,
) {
  const [rule] = await db
    .insert(routingRules)
    .values({
      workspace_id: workspaceId,
      name: input.name,
      strategy: input.strategy,
      priority: input.priority,
      provider_id: input.provider_id,
      conditions: input.conditions,
    })
    .returning();

  return rule;
}

export async function listRoutingRules(workspaceId: string) {
  return db
    .select()
    .from(routingRules)
    .where(eq(routingRules.workspace_id, workspaceId))
    .orderBy(routingRules.priority);
}

export async function getRoutingRule(workspaceId: string, ruleId: string) {
  const [rule] = await db
    .select()
    .from(routingRules)
    .where(
      and(
        eq(routingRules.id, ruleId),
        eq(routingRules.workspace_id, workspaceId),
      ),
    )
    .limit(1);

  if (!rule) {
    throw AppError.notFound("Routing rule not found");
  }

  return rule;
}

export async function updateRoutingRule(
  workspaceId: string,
  ruleId: string,
  input: UpdateRoutingRuleInput,
) {
  const updateData: Record<string, unknown> = { updated_at: new Date() };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.strategy !== undefined) updateData.strategy = input.strategy;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.provider_id !== undefined)
    updateData.provider_id = input.provider_id;
  if (input.conditions !== undefined) updateData.conditions = input.conditions;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const [rule] = await db
    .update(routingRules)
    .set(updateData)
    .where(
      and(
        eq(routingRules.id, ruleId),
        eq(routingRules.workspace_id, workspaceId),
      ),
    )
    .returning();

  if (!rule) {
    throw AppError.notFound("Routing rule not found");
  }

  return rule;
}

export async function deleteRoutingRule(workspaceId: string, ruleId: string) {
  const [rule] = await db
    .delete(routingRules)
    .where(
      and(
        eq(routingRules.id, ruleId),
        eq(routingRules.workspace_id, workspaceId),
      ),
    )
    .returning();

  if (!rule) {
    throw AppError.notFound("Routing rule not found");
  }

  return { id: rule.id, deleted: true };
}
