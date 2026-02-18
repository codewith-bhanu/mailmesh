import type {
  EmailMessage,
  EmailProvider,
  ProviderSendResult,
} from "./base.provider";

export class ResendProvider implements EmailProvider {
  readonly name = "Resend";
  readonly type = "resend";
  private apiKey: string;

  constructor(credentials: { api_key: string }) {
    this.apiKey = credentials.api_key;
  }

  async send(message: EmailMessage): Promise<ProviderSendResult> {
    try {
      const payload = {
        from: message.from.name
          ? `${message.from.name} <${message.from.email}>`
          : message.from.email,
        to: message.to.map((r) => r.email),
        ...(message.cc && { cc: message.cc.map((r) => r.email) }),
        ...(message.bcc && { bcc: message.bcc.map((r) => r.email) }),
        ...(message.reply_to && { reply_to: [message.reply_to] }),
        subject: message.subject,
        ...(message.html && { html: message.html }),
        ...(message.text && { text: message.text }),
        ...(message.tags?.[0] && {
          tags: message.tags.map((t) => ({ name: t, value: t })),
        }),
        ...(message.headers && { headers: message.headers }),
      };

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = (await response.json()) as { id?: string };
        return { success: true, provider_message_id: data.id };
      }

      const errorBody = await response.text();
      return {
        success: false,
        error: `Resend error: ${response.status} - ${errorBody}`,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Resend send failed",
      };
    }
  }
}
