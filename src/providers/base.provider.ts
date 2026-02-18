/**
 * Base email provider interface.
 * All provider adapters must implement this contract.
 */

export interface EmailMessage {
  from: { email: string; name?: string };
  to: Array<{ email: string; name?: string }>;
  cc?: Array<{ email: string; name?: string }>;
  bcc?: Array<{ email: string; name?: string }>;
  reply_to?: string;
  subject: string;
  html?: string;
  text?: string;
  headers?: Record<string, string>;
  tags?: string[];
  metadata?: Record<string, string>;
}

export interface ProviderSendResult {
  success: boolean;
  provider_message_id?: string;
  error?: string;
  raw_response?: unknown;
}

export interface EmailProvider {
  readonly name: string;
  readonly type: string;

  /**
   * Send a single email through this provider.
   */
  send(message: EmailMessage): Promise<ProviderSendResult>;

  /**
   * Validate that credentials are correct (optional health check).
   */
  validateCredentials?(): Promise<boolean>;
}
