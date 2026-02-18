import type {
  EmailMessage,
  EmailProvider,
  ProviderSendResult,
} from "./base.provider";

export class SendGridProvider implements EmailProvider {
  readonly name = "SendGrid";
  readonly type = "sendgrid";
  private apiKey: string;

  constructor(credentials: { api_key: string }) {
    this.apiKey = credentials.api_key;
  }

  async send(message: EmailMessage): Promise<ProviderSendResult> {
    try {
      const payload = {
        personalizations: [
          {
            to: message.to.map((r) => ({ email: r.email, name: r.name })),
            ...(message.cc && {
              cc: message.cc.map((r) => ({ email: r.email, name: r.name })),
            }),
            ...(message.bcc && {
              bcc: message.bcc.map((r) => ({ email: r.email, name: r.name })),
            }),
          },
        ],
        from: { email: message.from.email, name: message.from.name },
        subject: message.subject,
        content: [
          ...(message.text
            ? [{ type: "text/plain", value: message.text }]
            : []),
          ...(message.html ? [{ type: "text/html", value: message.html }] : []),
        ],
        ...(message.reply_to && { reply_to: { email: message.reply_to } }),
        ...(message.headers && { headers: message.headers }),
      };

      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const messageId = response.headers.get("X-Message-Id") || undefined;
        return { success: true, provider_message_id: messageId };
      }

      const errorBody = await response.text();
      return {
        success: false,
        error: `SendGrid error: ${response.status} - ${errorBody}`,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "SendGrid send failed",
      };
    }
  }
}
