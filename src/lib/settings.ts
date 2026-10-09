import { query } from "./db";

let cachedDataSource: "db" | "anilist" | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 3000; // 3-second cache for high-throughput Next.js requests

export async function getSetting(key: string, defaultValue = ""): Promise<string> {
  try {
    const res = await query(
      `SELECT value FROM system_settings WHERE key = $1 LIMIT 1;`,
      [key]
    );
    if (res.rows.length > 0 && res.rows[0].value !== null) {
      return res.rows[0].value;
    }
  } catch (err) {
    console.warn(`Could not read system_setting "${key}":`, err);
  }
  return defaultValue;
}

export async function setSetting(key: string, value: string): Promise<boolean> {
  try {
    await query(
      `
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = NOW();
    `,
      [key, value]
    );
    return true;
  } catch (err) {
    console.error(`Failed to update system_setting "${key}" in PostgreSQL:`, err);
    return false;
  }
}

export async function getDataSourceSetting(): Promise<"db" | "anilist"> {
  const now = Date.now();
  if (cachedDataSource && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedDataSource;
  }

  const val = await getSetting("data_source", "db");
  if (val === "anilist" || val === "db") {
    cachedDataSource = val;
    lastCacheTime = now;
    return cachedDataSource;
  }

  cachedDataSource = "db";
  lastCacheTime = now;
  return "db";
}

export async function setDataSourceSetting(source: "db" | "anilist"): Promise<boolean> {
  const ok = await setSetting("data_source", source);
  if (ok) {
    cachedDataSource = source;
    lastCacheTime = Date.now();
  }
  return ok;
}

export async function getAiringSyncSettings() {
  const enabledStr = await getSetting("airing_auto_sync_enabled", "true");
  const lastSyncAt = await getSetting("airing_last_sync_at", "");
  const intervalStr = await getSetting("airing_sync_interval_minutes", "30");

  return {
    autoSyncEnabled: enabledStr === "true",
    lastSyncAt: lastSyncAt || null,
    intervalMinutes: parseInt(intervalStr, 10) || 30,
  };
}

export async function setAiringAutoSync(enabled: boolean): Promise<boolean> {
  return setSetting("airing_auto_sync_enabled", enabled ? "true" : "false");
}

export async function recordAiringLastSync(timestampIso: string): Promise<boolean> {
  return setSetting("airing_last_sync_at", timestampIso);
}
