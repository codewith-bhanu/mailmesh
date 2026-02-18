import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
  createHmac,
} from "crypto";
import { env } from "../config/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt plaintext with AES-256-GCM.
 * Returns base64-encoded string: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = Buffer.from(env.ENCRYPTION_KEY, "hex");
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypt AES-256-GCM ciphertext.
 * Expects format: iv:authTag:ciphertext (all base64)
 */
export function decrypt(ciphertext: string): string {
  const key = Buffer.from(env.ENCRYPTION_KEY, "hex");
  const [ivB64, authTagB64, encryptedB64] = ciphertext.split(":");

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}

/**
 * SHA-256 hash (hex output). Used for API key hashing.
 */
export function hashSHA256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * HMAC-SHA256 signature (hex output). Used for webhook signing.
 */
export function signHMAC(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}
