import { db } from "../db/db-client";
import { emails, emailEvents, providers } from "../db/schema";
import { eq, and, sql, count } from "drizzle-orm";

interface AnalyticsResult {
  total_sent: number;
  total_delivered: number;
  total_bounced: number;
  total_opened: number;
  total_clicked: number;
  total_complained: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
}

export async function getWorkspaceAnalytics(
  workspaceId: string,
  startDate?: string,
  endDate?: string,
): Promise<AnalyticsResult> {
  // Count emails by status
  const emailStats = await db
    .select({
      status: emails.status,
      count: count(),
    })
    .from(emails)
    .where(eq(emails.workspace_id, workspaceId))
    .groupBy(emails.status);

  const statusMap: Record<string, number> = {};
  for (const stat of emailStats) {
    statusMap[stat.status] = stat.count;
  }

  // Count events by type
  const eventStats = await db
    .select({
      event_type: emailEvents.event_type,
      count: count(),
    })
    .from(emailEvents)
    .innerJoin(emails, eq(emailEvents.email_id, emails.id))
    .where(eq(emails.workspace_id, workspaceId))
    .groupBy(emailEvents.event_type);

  const eventMap: Record<string, number> = {};
  for (const stat of eventStats) {
    eventMap[stat.event_type] = stat.count;
  }

  const totalSent = (statusMap["sent"] || 0) + (statusMap["delivered"] || 0);
  const totalDelivered = eventMap["delivered"] || 0;
  const totalBounced = eventMap["bounced"] || 0;
  const totalOpened = eventMap["opened"] || 0;
  const totalClicked = eventMap["clicked"] || 0;
  const totalComplained = eventMap["complained"] || 0;

  return {
    total_sent: totalSent,
    total_delivered: totalDelivered,
    total_bounced: totalBounced,
    total_opened: totalOpened,
    total_clicked: totalClicked,
    total_complained: totalComplained,
    delivery_rate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
    open_rate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
    click_rate: totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0,
    bounce_rate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
  };
}

export async function getProviderAnalytics(workspaceId: string) {
  const providerStats = await db
    .select({
      provider_id: emails.provider_id,
      provider_name: providers.name,
      provider_type: providers.type,
      total: count(),
      status: emails.status,
    })
    .from(emails)
    .leftJoin(providers, eq(emails.provider_id, providers.id))
    .where(eq(emails.workspace_id, workspaceId))
    .groupBy(emails.provider_id, providers.name, providers.type, emails.status);

  // Group by provider
  const providerMap = new Map<
    string,
    {
      provider_id: string | null;
      provider_name: string | null;
      provider_type: string | null;
      stats: Record<string, number>;
    }
  >();

  for (const stat of providerStats) {
    const key = stat.provider_id || "unknown";
    if (!providerMap.has(key)) {
      providerMap.set(key, {
        provider_id: stat.provider_id,
        provider_name: stat.provider_name,
        provider_type: stat.provider_type,
        stats: {},
      });
    }
    providerMap.get(key)!.stats[stat.status] = stat.total;
  }

  return Array.from(providerMap.values());
}
