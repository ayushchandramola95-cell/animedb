import { query } from "./db";

let cachedDataSource: "db" | "anilist" | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 3000; // 3-second cache for high-throughput Next.js requests

export async function getDataSourceSetting(): Promise<"db" | "anilist"> {
  const now = Date.now();
  if (cachedDataSource && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedDataSource;
  }

  try {
    const res = await query(
      `SELECT value FROM system_settings WHERE key = 'data_source' LIMIT 1;`
    );
    if (res.rows.length > 0 && (res.rows[0].value === "anilist" || res.rows[0].value === "db")) {
      cachedDataSource = res.rows[0].value as "db" | "anilist";
      lastCacheTime = now;
      return cachedDataSource;
    }
  } catch (err) {
    console.warn("Could not read system_settings, defaulting to 'db':", err);
  }

  cachedDataSource = "db";
  lastCacheTime = now;
  return "db";
}

export async function setDataSourceSetting(source: "db" | "anilist"): Promise<boolean> {
  try {
    await query(
      `
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ('data_source', $1, NOW())
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = NOW();
    `,
      [source]
    );
    cachedDataSource = source;
    lastCacheTime = Date.now();
    return true;
  } catch (err) {
    console.error("Failed to update data_source setting in PostgreSQL:", err);
    return false;
  }
}
