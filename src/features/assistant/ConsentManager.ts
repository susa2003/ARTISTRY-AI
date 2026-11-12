/**
 * ARTISTRY AI — Privacy & Consent Manager for AI Reference Analysis
 * Enforces explicit user confirmation before any image leaves the device.
 * Defaults to private offline local processing.
 */

import * as SQLite from "expo-sqlite";

const CONSENT_KEY = "remote_ai_consent";

let dbInstance: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync("artistry-ai.db");
  }
  return dbInstance;
}

/**
 * Checks whether the user has explicitly consented to remote cloud AI image processing.
 */
export async function getRemoteAIConsent(): Promise<boolean> {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_metadata WHERE key = ?",
      CONSENT_KEY
    );
    return row?.value === "true";
  } catch {
    return false;
  }
}

/**
 * Sets user consent preference for remote cloud AI processing.
 */
export async function setRemoteAIConsent(consented: boolean): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(
      "INSERT INTO app_metadata (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      CONSENT_KEY,
      consented ? "true" : "false"
    );
  } catch {
    // Safe fallback
  }
}

/**
 * Returns privacy disclosures and policy statements for user display.
 */
export function getPrivacyDisclosure(): {
  title: string;
  body: string;
  localGuarantee: string;
  cloudNotice: string;
} {
  return {
    title: "AI Processing & Privacy Consent",
    body: "ARTISTRY AI provides instant local on-device reference analysis by default. Remote AI analysis utilizes cloud models to generate enhanced composition and lighting insights.",
    localGuarantee: "🔒 Offline / Local Mode: Your images NEVER leave your device. All calculations run strictly on your phone's processor.",
    cloudNotice: "☁️ Remote Cloud Processing: Only occurs when you tap 'Analyze with Cloud AI'. Your image is transmitted over encrypted TLS solely for drawing analysis and is not used for external model training.",
  };
}
