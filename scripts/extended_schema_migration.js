// scripts/extended_schema_migration.js
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
  password: process.env.DB_PASSWORD || "Ayush1234@7890",
  database: process.env.DB_NAME || "postgres",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const EXTENDED_SCHEMA_SQL = `
-- 1. Anime Episode-by-Episode Guide Table
CREATE TABLE IF NOT EXISTS anime_episodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anime_id INTEGER REFERENCES anime(anilist_id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title TEXT,
    title_japanese TEXT,
    title_romanji TEXT,
    synopsis TEXT,
    thumbnail_url TEXT,
    air_date TIMESTAMPTZ,
    duration INTEGER,
    is_filler BOOLEAN DEFAULT false,
    is_recap BOOLEAN DEFAULT false,
    site_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_anime_episode UNIQUE (anime_id, episode_number)
);

CREATE INDEX IF NOT EXISTS idx_episodes_anime_num ON anime_episodes (anime_id, episode_number ASC);

-- 2. Anime Theme Songs (Opening & Ending OSTs) Table
CREATE TABLE IF NOT EXISTS anime_theme_songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anime_id INTEGER REFERENCES anime(anilist_id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL, -- 'OPENING' or 'ENDING'
    sequence_number INTEGER DEFAULT 1,
    title TEXT NOT NULL,
    artist TEXT,
    episodes TEXT,
    spotify_url TEXT,
    youtube_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_anime_theme UNIQUE (anime_id, type, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_themes_anime ON anime_theme_songs (anime_id, type, sequence_number ASC);

-- 3. Non-Japanese Multilingual Dub Voice Actors Table
CREATE TABLE IF NOT EXISTS character_dubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anime_id INTEGER REFERENCES anime(anilist_id) ON DELETE CASCADE,
    character_id INTEGER REFERENCES characters(anilist_id) ON DELETE CASCADE,
    voice_actor_id INTEGER REFERENCES voice_actors(anilist_id) ON DELETE CASCADE,
    language VARCHAR(50) NOT NULL DEFAULT 'English',
    role VARCHAR(30) DEFAULT 'MAIN',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_character_dub UNIQUE (anime_id, character_id, voice_actor_id, language)
);

CREATE INDEX IF NOT EXISTS idx_dubs_anime_lang ON character_dubs (anime_id, language);

-- 4. User-Written Community Reviews Table
CREATE TABLE IF NOT EXISTS anime_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anilist_review_id INTEGER UNIQUE,
    anime_id INTEGER REFERENCES anime(anilist_id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_avatar_url TEXT,
    summary TEXT,
    body TEXT NOT NULL,
    score INTEGER,
    rating_amount INTEGER DEFAULT 0,
    site_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_anime_review UNIQUE (anime_id, anilist_review_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_anime_rating ON anime_reviews (anime_id, rating_amount DESC);
`;

async function run() {
  console.log("Connecting to PostgreSQL at:", process.env.DB_HOST || "35.194.28.236");
  const client = await pool.connect();
  try {
    console.log("Connected successfully! Executing Extended Schema Migration...");
    await client.query(EXTENDED_SCHEMA_SQL);
    console.log("✅ Extended Schema Migration completed successfully!");

    // Verify tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log("Current Tables in Cloud SQL:", res.rows.map(r => r.table_name));
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Migration Failed:", err);
  process.exit(1);
});
