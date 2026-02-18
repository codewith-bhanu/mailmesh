import type {
  EmailMessage,
  EmailProvider,
  ProviderSendResult,
} from "./base.provider";
import { randomUUID } from "crypto";

/**
 * SMTP provider using raw SMTP connection via Bun/Node net.
 * In production, use a library like `nodemailer` for full SMTP support.
 * This is a simplified implementation that demonstrates the adapter pattern.
 */
export class SMTPProvider implements EmailProvider {
  readonly name = "SMTP";
  readonly type = "smtp";
  private host: string;
  private port: number;
  private secure: boolean;
  private username: string;
  private password: string;

  constructor(credentials: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
  }) {
    this.host = credentials.host;
    this.port = credentials.port;
    this.secure = credentials.secure;
    this.username = credentials.username;
    this.password = credentials.password;
  }

  async send(message: EmailMessage): Promise<ProviderSendResult> {
    try {
      // Build MIME message
      const boundary = `----=_Part_${randomUUID()}`;
      const messageId = `<${randomUUID()}@${this.host}>`;

      const headers = [
        `From: ${message.from.name ? `${message.from.name} <${message.from.email}>` : message.from.email}`,
        `To: ${message.to.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)).join(", ")}`,
        `Subject: ${message.subject}`,
        `Message-ID: ${messageId}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ];

      if (message.cc) {
        headers.push(`Cc: ${message.cc.map((r) => r.email).join(", ")}`);
      }
      if (message.reply_to) {
        headers.push(`Reply-To: ${message.reply_to}`);
      }

      let body = headers.join("\r\n") + "\r\n\r\n";

      if (message.text) {
        body += `--${boundary}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${message.text}\r\n`;
      }
      if (message.html) {
        body += `--${boundary}\r\nContent-Type: text/html; charset=utf-8\r\n\r\n${message.html}\r\n`;
      }
      body += `--${boundary}--\r\n`;

      // Note: In production, use nodemailer or establish actual SMTP connection.
      // This is a structural placeholder that shows the adapter pattern.
      console.log(
        `[SMTP] Would send to ${this.host}:${this.port} with auth ${this.username}`,
      );

      return {
        success: true,
        provider_message_id: messageId,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "SMTP send failed",
      };
    }
  }
}
