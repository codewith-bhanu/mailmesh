import type {
  EmailMessage,
  EmailProvider,
  ProviderSendResult,
} from "./base.provider";

export class PostmarkProvider implements EmailProvider {
  readonly name = "Postmark";
  readonly type = "postmark";
  private apiKey: string;

  constructor(credentials: { api_key: string }) {
    this.apiKey = credentials.api_key;
  }

  async send(message: EmailMessage): Promise<ProviderSendResult> {
    try {
      const payload = {
        From: message.from.name
          ? `${message.from.name} <${message.from.email}>`
          : message.from.email,
        To: message.to
          .map((r) => (r.name ? `${r.name} <${r.email}>` : r.email))
          .join(","),
        ...(message.cc && {
          Cc: message.cc.map((r) => r.email).join(","),
        }),
        ...(message.bcc && {
          Bcc: message.bcc.map((r) => r.email).join(","),
        }),
        ...(message.reply_to && { ReplyTo: message.reply_to }),
        Subject: message.subject,
        ...(message.html && { HtmlBody: message.html }),
        ...(message.text && { TextBody: message.text }),
        ...(message.tags?.[0] && { Tag: message.tags[0] }), // Postmark supports single tag
        ...(message.headers && {
          Headers: Object.entries(message.headers).map(([Name, Value]) => ({
            Name,
            Value,
          })),
        }),
        ...(message.metadata && { Metadata: message.metadata }),
        MessageStream: "outbound",
      };

      const response = await fetch("https://api.postmarkapp.com/email", {
        method: "POST",
        headers: {
          "X-Postmark-Server-Token": this.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = (await response.json()) as { MessageID?: string };
        return { success: true, provider_message_id: data.MessageID };
      }

      const errorBody = await response.text();
      return {
        success: false,
        error: `Postmark error: ${response.status} - ${errorBody}`,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Postmark send failed",
      };
    }
  }
}
