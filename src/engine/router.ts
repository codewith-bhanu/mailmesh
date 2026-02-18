import { db } from "../db/db-client";
import { providers, routingRules, emails } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { createProviderAdapter } from "../providers/registry";
import { selectByPriority, getFailoverProvider } from "./strategies/priority";
import { selectByRoundRobin } from "./strategies/round-robin";
import { selectByLeastUsed } from "./strategies/least-used";
import { selectByCondition } from "./strategies/conditional";
import type {
  EmailMessage,
  ProviderSendResult,
} from "../providers/base.provider";
import type { Provider, Email } from "../db/schema";

interface RouteResult {
  success: boolean;
  provider_id?: string;
  provider_message_id?: string;
  error?: string;
  attempts: Array<{
    provider_id: string;
    provider_type: string;
    error?: string;
  }>;
}

/**
 * Core routing engine:
 * 1. Load workspace providers and routing rules
 * 2. Select a provider using the configured strategy
 * 3. Attempt to send via selected provider
 * 4. On failure, failover to next available provider
 */
export async function routeAndSend(
  email: Email,
  workspaceId: string,
): Promise<RouteResult> {
  // Load providers
  const workspaceProviders = await db
    .select()
    .from(providers)
    .where(
      and(
        eq(providers.workspace_id, workspaceId),
        eq(providers.is_active, true),
      ),
    );

  if (workspaceProviders.length === 0) {
    return {
      success: false,
      error: "No active providers configured",
      attempts: [],
    };
  }

  // Load routing rules
  const rules = await db
    .select()
    .from(routingRules)
    .where(
      and(
        eq(routingRules.workspace_id, workspaceId),
        eq(routingRules.is_active, true),
      ),
    )
    .orderBy(routingRules.priority);

  // Determine strategy from first active rule (or default to priority)
  const activeRule = rules[0];
  const strategy = activeRule?.strategy || "priority";

  // Build email context for conditional routing
  const emailContext = {
    tags: (email.tags as string[]) || [],
    from_email: email.from_email,
    to_emails: (email.to as Array<{ email: string }>).map((r) => r.email),
    metadata: (email.metadata as Record<string, string>) || {},
  };

  // Select provider based on strategy
  let selectedProvider = selectProvider(
    strategy,
    workspaceProviders,
    rules,
    emailContext,
    workspaceId,
  );

  if (!selectedProvider) {
    // Fallback to priority if strategy yields nothing
    selectedProvider = selectByPriority(workspaceProviders);
  }

  if (!selectedProvider) {
    return {
      success: false,
      error: "No suitable provider found",
      attempts: [],
    };
  }

  // Build the email message
  const message: EmailMessage = {
    from: { email: email.from_email, name: email.from_name || undefined },
    to: email.to as Array<{ email: string; name?: string }>,
    cc: (email.cc as Array<{ email: string; name?: string }>) || undefined,
    bcc: (email.bcc as Array<{ email: string; name?: string }>) || undefined,
    reply_to: email.reply_to || undefined,
    subject: email.subject,
    html: email.html || undefined,
    text: email.text || undefined,
    headers: (email.headers as Record<string, string>) || undefined,
    tags: (email.tags as string[]) || undefined,
    metadata: (email.metadata as Record<string, string>) || undefined,
  };

  // Attempt to send with failover
  const attempts: RouteResult["attempts"] = [];
  const triedProviderIds = new Set<string>();
  let currentProvider: Provider | null = selectedProvider;

  while (currentProvider) {
    if (triedProviderIds.has(currentProvider.id)) break;
    triedProviderIds.add(currentProvider.id);

    // Check provider daily limit
    if (
      currentProvider.daily_limit &&
      (currentProvider.sent_today ?? 0) >= currentProvider.daily_limit
    ) {
      attempts.push({
        provider_id: currentProvider.id,
        provider_type: currentProvider.type,
        error: "Daily limit exceeded",
      });
      currentProvider = getFailoverProvider(
        workspaceProviders.filter((p) => !triedProviderIds.has(p.id)),
        currentProvider.id,
      );
      continue;
    }

    try {
      const adapter = createProviderAdapter(currentProvider);
      const result: ProviderSendResult = await adapter.send(message);

      attempts.push({
        provider_id: currentProvider.id,
        provider_type: currentProvider.type,
        error: result.error,
      });

      if (result.success) {
        // Increment sent_today
        await db
          .update(providers)
          .set({ sent_today: (currentProvider.sent_today ?? 0) + 1 })
          .where(eq(providers.id, currentProvider.id));

        return {
          success: true,
          provider_id: currentProvider.id,
          provider_message_id: result.provider_message_id,
          attempts,
        };
      }
    } catch (err) {
      attempts.push({
        provider_id: currentProvider.id,
        provider_type: currentProvider.type,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }

    // Failover to next provider
    currentProvider = getFailoverProvider(
      workspaceProviders.filter((p) => !triedProviderIds.has(p.id)),
      currentProvider.id,
    );
  }

  return {
    success: false,
    error: "All providers failed",
    attempts,
  };
}

function selectProvider(
  strategy: string,
  providersList: Provider[],
  rules: any[],
  context: any,
  workspaceId: string,
): Provider | null {
  switch (strategy) {
    case "priority":
      return selectByPriority(providersList);
    case "round-robin":
      return selectByRoundRobin(providersList, workspaceId);
    case "least-used":
      return selectByLeastUsed(providersList);
    case "conditional":
      return selectByCondition(providersList, rules, context);
    default:
      return selectByPriority(providersList);
  }
}
