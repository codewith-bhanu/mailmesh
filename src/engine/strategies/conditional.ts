import type { Provider, RoutingRule } from "../../db/schema";

interface EmailContext {
  tags?: string[];
  from_email?: string;
  to_emails: string[];
  metadata?: Record<string, string>;
}

/**
 * Conditional/tag-based strategy: matches routing rule conditions against email context.
 */
export function selectByCondition(
  providers: Provider[],
  rules: RoutingRule[],
  context: EmailContext,
): Provider | null {
  const activeProviders = new Map(
    providers.filter((p) => p.is_active).map((p) => [p.id, p]),
  );

  // Evaluate rules in priority order
  const sortedRules = [...rules]
    .filter((r) => r.is_active && r.strategy === "conditional")
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  for (const rule of sortedRules) {
    if (!rule.provider_id || !activeProviders.has(rule.provider_id)) continue;

    const conditions = rule.conditions as {
      tags?: string[];
      from_email?: string;
      to_domain?: string;
      metadata?: Record<string, string>;
    } | null;

    if (!conditions) {
      // No conditions = match all
      return activeProviders.get(rule.provider_id)!;
    }

    if (matchesConditions(conditions, context)) {
      return activeProviders.get(rule.provider_id)!;
    }
  }

  return null;
}

function matchesConditions(
  conditions: {
    tags?: string[];
    from_email?: string;
    to_domain?: string;
    metadata?: Record<string, string>;
  },
  context: EmailContext,
): boolean {
  // Tag matching: email must have at least one matching tag
  if (conditions.tags && conditions.tags.length > 0) {
    if (
      !context.tags ||
      !conditions.tags.some((t) => context.tags!.includes(t))
    ) {
      return false;
    }
  }

  // From email matching
  if (conditions.from_email && context.from_email !== conditions.from_email) {
    return false;
  }

  // To domain matching: at least one recipient must match the domain
  if (conditions.to_domain) {
    const domain = conditions.to_domain.toLowerCase();
    const hasMatch = context.to_emails.some((email) =>
      email.toLowerCase().endsWith(`@${domain}`),
    );
    if (!hasMatch) return false;
  }

  // Metadata matching: all specified metadata key-values must match
  if (conditions.metadata) {
    for (const [key, value] of Object.entries(conditions.metadata)) {
      if (!context.metadata || context.metadata[key] !== value) {
        return false;
      }
    }
  }

  return true;
}
