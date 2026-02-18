import { nanoid } from "nanoid";

const PREFIX = "mm_live_";
const KEY_LENGTH = 32;

/**
 * Generate a new API key with the MailMesh prefix.
 * Returns the raw key (shown once) and the prefix (for display).
 */
export function generateApiKey(): { rawKey: string; prefix: string } {
  const randomPart = nanoid(KEY_LENGTH);
  const rawKey = `${PREFIX}${randomPart}`;
  const prefix = `${PREFIX}${randomPart.slice(0, 8)}...`;
  return { rawKey, prefix };
}
