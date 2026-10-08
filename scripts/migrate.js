// scripts/migrate.js
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");

// Load .env.local if present
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...values] = trimmed.split("=");
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
  });
}

const pool = new Pool({
  host: process.env.DB_HOST || "35.194.28.236",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "postgres",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const SCHEMA_SQL = `
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Anime Core Table
CREATE TABLE IF NOT EXISTS anime (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anilist_id INTEGER UNIQUE NOT NULL,
    mal_id INTEGER,
    title_english TEXT,
    title_romaji TEXT NOT NULL,
    title_native TEXT,
    slug TEXT UNIQUE NOT NULL,
    synopsis TEXT,
    format VARCHAR(30) DEFAULT 'TV',
    status VARCHAR(30) DEFAULT 'FINISHED',
    season VARCHAR(20),
    season_year INTEGER,
    episodes_count INTEGER,
    episode_duration INTEGER,
    score NUMERIC(4, 1),
    popularity INTEGER,
    cover_image_url TEXT,
    banner_image_url TEXT,
    accent_color VARCHAR(15),
    genres TEXT[] DEFAULT '{}',
    studios JSONB DEFAULT '[]',
    youtube_trailer_id VARCHAR(50),
    next_airing_episode INTEGER,
    next_airing_at TIMESTAMPTZ,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Characters Table
CREATE TABLE IF NOT EXISTS characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anilist_id INTEGER UNIQUE NOT NULL,
    name_full TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Voice Actors Table (Seiyuu)
CREATE TABLE IF NOT EXISTS voice_actors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anilist_id INTEGER UNIQUE NOT NULL,
    name_full TEXT NOT NULL,
    image_url TEXT,
    language VARCHAR(50) DEFAULT 'Japanese',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Anime Characters & Voice Actor Relation
CREATE TABLE IF NOT EXISTS anime_characters (
    anime_id INTEGER REFERENCES anime(anilist_id) ON DELETE CASCADE,
    character_id INTEGER REFERENCES characters(anilist_id) ON DELETE CASCADE,
    voice_actor_id INTEGER REFERENCES voice_actors(anilist_id) ON DELETE SET NULL,
    role VARCHAR(30) DEFAULT 'MAIN',
    PRIMARY KEY (anime_id, character_id)
);

-- 5. Streaming Links (Official & Affiliate Destinations)
CREATE TABLE IF NOT EXISTS streaming_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anime_id INTEGER REFERENCES anime(anilist_id) ON DELETE CASCADE,
    platform_name VARCHAR(100) NOT NULL,
    target_url TEXT NOT NULL,
    affiliate_url TEXT,
    is_official BOOLEAN DEFAULT true,
    region VARCHAR(10) DEFAULT 'US',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Ingestion & Sync Audit Logs
CREATE TABLE IF NOT EXISTS sync_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    count_processed INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'SUCCESS',
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Performance & Search Indexes
CREATE INDEX IF NOT EXISTS idx_anime_score ON anime (score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_anime_popularity ON anime (popularity DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_anime_status ON anime (status);
CREATE INDEX IF NOT EXISTS idx_anime_airing ON anime (status, next_airing_at) WHERE status = 'RELEASING';
CREATE INDEX IF NOT EXISTS idx_anime_season ON anime (season, season_year);
CREATE INDEX IF NOT EXISTS idx_anime_title_trgm ON anime USING gin (title_romaji gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_anime_title_en_trgm ON anime USING gin (title_english gin_trgm_ops);
`;

async function runMigration() {
  console.log("Connecting to PostgreSQL at:", process.env.DB_HOST || "35.194.28.236");
  try {
    const client = await pool.connect();
    console.log("Connected successfully to PostgreSQL!");
    console.log("Executing schema migration...");
    await client.query(SCHEMA_SQL);
    console.log("Schema migration completed successfully! All tables and indexes are ready.");
    client.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  }
}

runMigration();
