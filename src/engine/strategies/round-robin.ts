import type { Provider } from "../../db/schema";

// In-memory round-robin counters per workspace
const counters = new Map<string, number>();

/**
 * Round-robin strategy: distributes sends evenly across active providers.
 */
export function selectByRoundRobin(
  providers: Provider[],
  workspaceId: string,
): Provider | null {
  const active = providers.filter((p) => p.is_active);
  if (active.length === 0) return null;

  const current = counters.get(workspaceId) ?? 0;
  const selected = active[current % active.length];
  counters.set(workspaceId, current + 1);

  return selected;
}
