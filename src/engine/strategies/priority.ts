import type { Provider } from "../../db/schema";

/**
 * Priority/Failover strategy: providers ordered by priority field.
 * Returns the highest-priority active provider.
 */
export function selectByPriority(providers: Provider[]): Provider | null {
  const sorted = [...providers]
    .filter((p) => p.is_active)
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  return sorted[0] || null;
}

/**
 * Get the next provider in priority order for failover.
 */
export function getFailoverProvider(
  providers: Provider[],
  failedProviderId: string,
): Provider | null {
  const sorted = [...providers]
    .filter((p) => p.is_active && p.id !== failedProviderId)
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  return sorted[0] || null;
}
