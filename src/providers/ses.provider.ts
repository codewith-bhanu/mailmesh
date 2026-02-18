import type {
  EmailMessage,
  EmailProvider,
  ProviderSendResult,
} from "./base.provider";

export class SESProvider implements EmailProvider {
  readonly name = "AWS SES";
  readonly type = "ses";
  private accessKeyId: string;
  private secretAccessKey: string;
  private region: string;

  constructor(credentials: {
    access_key_id: string;
    secret_access_key: string;
    region?: string;
  }) {
    this.accessKeyId = credentials.access_key_id;
    this.secretAccessKey = credentials.secret_access_key;
    this.region = credentials.region || "us-east-1";
  }

  async send(message: EmailMessage): Promise<ProviderSendResult> {
    try {
      // AWS SES v2 SendEmail API via HTTP
      // In production, use @aws-sdk/client-sesv2
      const payload = {
        FromEmailAddress: message.from.name
          ? `${message.from.name} <${message.from.email}>`
          : message.from.email,
        Destination: {
          ToAddresses: message.to.map((r) => r.email),
          ...(message.cc && { CcAddresses: message.cc.map((r) => r.email) }),
          ...(message.bcc && { BccAddresses: message.bcc.map((r) => r.email) }),
        },
        Content: {
          Simple: {
            Subject: { Data: message.subject },
            Body: {
              ...(message.html && { Html: { Data: message.html } }),
              ...(message.text && { Text: { Data: message.text } }),
            },
          },
        },
        ...(message.reply_to && { ReplyToAddresses: [message.reply_to] }),
        ...(message.tags && {
          EmailTags: message.tags.map((tag) => ({
            Name: "tag",
            Value: tag,
          })),
        }),
      };

      // Note: This is a simplified implementation.
      // For production, use AWS SDK with proper SigV4 signing.
      const endpoint = `https://email.${this.region}.amazonaws.com/v2/email/outbound-emails`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // AWS SigV4 signing would go here in production
          "X-Amz-Access-Key": this.accessKeyId,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = (await response.json()) as { MessageId?: string };
        return { success: true, provider_message_id: data.MessageId };
      }

      const errorBody = await response.text();
      return {
        success: false,
        error: `SES error: ${response.status} - ${errorBody}`,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "SES send failed",
      };
    }
  }
}
