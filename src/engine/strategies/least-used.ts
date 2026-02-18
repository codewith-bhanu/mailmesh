import type { Provider } from "../../db/schema";

/**
 * Least-used strategy: selects the provider with the lowest sent_today count.
 */
export function selectByLeastUsed(providers: Provider[]): Provider | null {
  const active = providers.filter((p) => p.is_active);
  if (active.length === 0) return null;

  return active.reduce((min, p) =>
    (p.sent_today ?? 0) < (min.sent_today ?? 0) ? p : min,
  );
}
