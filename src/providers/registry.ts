import type { EmailProvider } from "./base.provider";
import { SendGridProvider } from "./sendgrid.provider";
import { BrevoProvider } from "./brevo.provider";
import { MailgunProvider } from "./mailgun.provider";
import { SESProvider } from "./ses.provider";
import { PostmarkProvider } from "./postmark.provider";
import { ResendProvider } from "./resend.provider";
import { SMTPProvider } from "./smtp.provider";
import { decrypt } from "../lib/crypto";
import type { Provider } from "../db/schema";

/**
 * Factory that instantiates the correct provider adapter
 * based on the provider type and decrypted credentials.
 */
export function createProviderAdapter(provider: Provider): EmailProvider {
  const credentials = JSON.parse(decrypt(provider.encrypted_credentials));

  switch (provider.type) {
    case "sendgrid":
      return new SendGridProvider(credentials);
    case "brevo":
      return new BrevoProvider(credentials);
    case "mailgun":
      return new MailgunProvider(credentials);
    case "ses":
      return new SESProvider(credentials);
    case "postmark":
      return new PostmarkProvider(credentials);
    case "resend":
      return new ResendProvider(credentials);
    case "smtp":
      return new SMTPProvider(credentials);
    default:
      throw new Error(`Unsupported provider type: ${provider.type}`);
  }
}
