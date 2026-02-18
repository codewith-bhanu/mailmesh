import { Hono } from "hono";
import { db } from "../db/db-client";
import { emails, emailEvents, webhookDeliveries } from "../db/schema";
import { eq } from "drizzle-orm";
import * as eventService from "../services/event.service";
import * as suppressionService from "../services/suppression.service";
import * as webhookService from "../services/webhook.service";
import { addWebhookToQueue } from "../queue/webhook.queue";

const inboundWebhooks = new Hono();

/**
 * Normalize provider-specific webhook payloads into a unified event format.
 */
function normalizeEvent(
  provider: string,
  payload: Record<string, unknown>,
): {
  event_type:
    | "delivered"
    | "bounced"
    | "opened"
    | "clicked"
    | "complained"
    | "unsubscribed"
    | "deferred"
    | "dropped";
  provider_event_id?: string;
  recipient?: string;
} | null {
  switch (provider) {
    case "sendgrid": {
      const eventMap: Record<string, string> = {
        delivered: "delivered",
        bounce: "bounced",
        open: "opened",
        click: "clicked",
        spamreport: "complained",
        unsubscribe: "unsubscribed",
        deferred: "deferred",
        dropped: "dropped",
      };
      const eventType = eventMap[(payload.event as string) || ""] as any;
      if (!eventType) return null;
      return {
        event_type: eventType,
        provider_event_id: payload.sg_message_id as string,
        recipient: payload.email as string,
      };
    }

    case "brevo": {
      const eventMap: Record<string, string> = {
        delivered: "delivered",
        hard_bounce: "bounced",
        soft_bounce: "deferred",
        opened: "opened",
        click: "clicked",
        complaint: "complained",
        unsubscribed: "unsubscribed",
      };
      const eventType = eventMap[(payload.event as string) || ""] as any;
      if (!eventType) return null;
      return {
        event_type: eventType,
        provider_event_id: payload["message-id"] as string,
        recipient: payload.email as string,
      };
    }

    case "mailgun": {
      const eventMap: Record<string, string> = {
        delivered: "delivered",
        failed: "bounced",
        opened: "opened",
        clicked: "clicked",
        complained: "complained",
        unsubscribed: "unsubscribed",
      };
      const eventData =
        (payload["event-data"] as Record<string, unknown>) || payload;
      const eventType = eventMap[(eventData.event as string) || ""] as any;
      if (!eventType) return null;
      return {
        event_type: eventType,
        provider_event_id: eventData.id as string,
        recipient: eventData.recipient as string,
      };
    }

    case "postmark": {
      const eventMap: Record<string, string> = {
        Delivery: "delivered",
        Bounce: "bounced",
        Open: "opened",
        Click: "clicked",
        SpamComplaint: "complained",
        SubscriptionChange: "unsubscribed",
      };
      const eventType = eventMap[(payload.RecordType as string) || ""] as any;
      if (!eventType) return null;
      return {
        event_type: eventType,
        provider_event_id: payload.MessageID as string,
        recipient: (payload.Recipient as string) || (payload.Email as string),
      };
    }

    case "resend": {
      const eventMap: Record<string, string> = {
        "email.delivered": "delivered",
        "email.bounced": "bounced",
        "email.opened": "opened",
        "email.clicked": "clicked",
        "email.complained": "complained",
      };
      const eventType = eventMap[(payload.type as string) || ""] as any;
      if (!eventType) return null;
      const data = (payload.data as Record<string, unknown>) || {};
      return {
        event_type: eventType,
        provider_event_id: data.email_id as string,
        recipient: (data.to as string[])?.join(","),
      };
    }

    default:
      return null;
  }
}

// POST /webhooks/inbound/:provider
inboundWebhooks.post("/:provider", async (c) => {
  const provider = c.req.param("provider");
  const payload = await c.req.json();

  const events = Array.isArray(payload) ? payload : [payload];

  for (const eventPayload of events) {
    const normalized = normalizeEvent(provider, eventPayload);
    if (!normalized) continue;

    // Find the email by provider_message_id
    const providerMsgId = normalized.provider_event_id;

    if (!providerMsgId) continue;

    const [emailRecord] = await db
      .select()
      .from(emails)
      .where(eq(emails.provider_message_id, providerMsgId))
      .limit(1);

    if (!emailRecord) continue;

    // Record the event
    const event = await eventService.createEvent({
      email_id: emailRecord.id,
      event_type: normalized.event_type,
      provider_event_id: normalized.provider_event_id,
      recipient: normalized.recipient,
      raw_payload: eventPayload,
    });

    // Update email status
    if (
      normalized.event_type === "delivered" ||
      normalized.event_type === "bounced"
    ) {
      await db
        .update(emails)
        .set({ status: normalized.event_type })
        .where(eq(emails.id, emailRecord.id));
    }

    // Auto-suppress on hard bounce or complaint
    if (
      normalized.event_type === "bounced" ||
      normalized.event_type === "complained"
    ) {
      if (normalized.recipient) {
        await suppressionService.addSuppression(
          emailRecord.workspace_id,
          normalized.recipient,
          normalized.event_type === "bounced" ? "hard_bounce" : "complaint",
          emailRecord.id,
        );
      }
    }

    // Dispatch to outbound webhooks
    const subscribedWebhooks = await webhookService.getWebhooksForEvent(
      emailRecord.workspace_id,
      normalized.event_type,
    );

    for (const webhook of subscribedWebhooks) {
      const [delivery] = await db
        .insert(webhookDeliveries)
        .values({
          webhook_id: webhook.id,
          event_id: event.id,
          payload: {
            event: normalized.event_type,
            email_id: emailRecord.id,
            recipient: normalized.recipient,
            timestamp: new Date().toISOString(),
            data: eventPayload,
          },
        })
        .returning();

      await addWebhookToQueue({
        webhookId: webhook.id,
        webhookUrl: webhook.url,
        secret: webhook.secret,
        payload: delivery.payload as Record<string, unknown>,
        deliveryId: delivery.id,
      });
    }
  }

  return c.json({ received: true });
});

export default inboundWebhooks;
