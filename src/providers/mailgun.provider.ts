import type {
  EmailMessage,
  EmailProvider,
  ProviderSendResult,
} from "./base.provider";

export class MailgunProvider implements EmailProvider {
  readonly name = "Mailgun";
  readonly type = "mailgun";
  private apiKey: string;
  private domain: string;

  constructor(credentials: { api_key: string; domain?: string }) {
    this.apiKey = credentials.api_key;
    this.domain = credentials.domain || "mg.example.com";
  }

  async send(message: EmailMessage): Promise<ProviderSendResult> {
    try {
      const formData = new FormData();
      formData.append(
        "from",
        message.from.name
          ? `${message.from.name} <${message.from.email}>`
          : message.from.email,
      );
      formData.append("to", message.to.map((r) => r.email).join(","));
      formData.append("subject", message.subject);

      if (message.cc)
        formData.append("cc", message.cc.map((r) => r.email).join(","));
      if (message.bcc)
        formData.append("bcc", message.bcc.map((r) => r.email).join(","));
      if (message.reply_to) formData.append("h:Reply-To", message.reply_to);
      if (message.html) formData.append("html", message.html);
      if (message.text) formData.append("text", message.text);
      if (message.tags) {
        message.tags.forEach((tag) => formData.append("o:tag", tag));
      }

      const response = await fetch(
        `https://api.mailgun.net/v3/${this.domain}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`api:${this.apiKey}`)}`,
          },
          body: formData,
        },
      );

      if (response.ok) {
        const data = (await response.json()) as { id?: string };
        return { success: true, provider_message_id: data.id };
      }

      const errorBody = await response.text();
      return {
        success: false,
        error: `Mailgun error: ${response.status} - ${errorBody}`,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Mailgun send failed",
      };
    }
  }
}
