import type {
  EmailMessage,
  EmailProvider,
  ProviderSendResult,
} from "./base.provider";

export class BrevoProvider implements EmailProvider {
  readonly name = "Brevo";
  readonly type = "brevo";
  private apiKey: string;

  constructor(credentials: { api_key: string }) {
    this.apiKey = credentials.api_key;
  }

  async send(message: EmailMessage): Promise<ProviderSendResult> {
    try {
      const payload = {
        sender: { email: message.from.email, name: message.from.name },
        to: message.to.map((r) => ({ email: r.email, name: r.name })),
        ...(message.cc && {
          cc: message.cc.map((r) => ({ email: r.email, name: r.name })),
        }),
        ...(message.bcc && {
          bcc: message.bcc.map((r) => ({ email: r.email, name: r.name })),
        }),
        ...(message.reply_to && { replyTo: { email: message.reply_to } }),
        subject: message.subject,
        ...(message.html && { htmlContent: message.html }),
        ...(message.text && { textContent: message.text }),
        ...(message.headers && { headers: message.headers }),
        ...(message.tags && { tags: message.tags }),
      };

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = (await response.json()) as { messageId?: string };
        return { success: true, provider_message_id: data.messageId };
      }

      const errorBody = await response.text();
      return {
        success: false,
        error: `Brevo error: ${response.status} - ${errorBody}`,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Brevo send failed",
      };
    }
  }
}
