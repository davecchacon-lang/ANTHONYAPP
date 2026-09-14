import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { integrationCredentials } from "@/db/schema";

const SLACK_KEY = "slack_bot_token";

// Secrets are stored as AES-256-GCM ciphertext, keyed off INTEGRATION_ENCRYPTION_KEY.
// Uses Web Crypto (crypto.subtle) rather than node:crypto so this works whether
// Netlify runs the route as a Node or an Edge function.
async function getEncryptionKey() {
  const secret = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!secret) throw new Error("INTEGRATION_ENCRYPTION_KEY is not configured.");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encrypt(value: string) {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value));
  return {
    ciphertext: Buffer.from(ciphertext).toString("base64"),
    iv: Buffer.from(iv).toString("base64"),
  };
}

async function decrypt(ciphertext: string, iv: string) {
  const key = await getEncryptionKey();
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: Buffer.from(iv, "base64") },
    key,
    Buffer.from(ciphertext, "base64"),
  );
  return new TextDecoder().decode(plaintext);
}

export async function saveSlackToken(token: string, updatedBy: string) {
  const { ciphertext, iv } = await encrypt(token);
  const updatedAt = new Date().toISOString();
  await getDb()
    .insert(integrationCredentials)
    .values({ key: SLACK_KEY, ciphertext, iv, updatedBy, updatedAt })
    .onConflictDoUpdate({
      target: integrationCredentials.key,
      set: { ciphertext, iv, updatedBy, updatedAt },
    });
}

export async function hasSlackToken() {
  const [row] = await getDb()
    .select({ key: integrationCredentials.key })
    .from(integrationCredentials)
    .where(eq(integrationCredentials.key, SLACK_KEY))
    .limit(1);
  return Boolean(row);
}

// Not imported by any route directly — lib/notify.ts uses this to actually
// call the Slack API on the workspace's behalf.
export async function getSlackToken(): Promise<string | null> {
  const [row] = await getDb()
    .select()
    .from(integrationCredentials)
    .where(eq(integrationCredentials.key, SLACK_KEY))
    .limit(1);
  if (!row) return null;
  try {
    return await decrypt(row.ciphertext, row.iv);
  } catch {
    return null;
  }
}

