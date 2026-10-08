// scripts/add-columns.js
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");

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
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "postgres",
});

async function main() {
  console.log("Adding extended columns to Cloud SQL anime table...");
  const sql = `
    ALTER TABLE anime ADD COLUMN IF NOT EXISTS source VARCHAR(50);
    ALTER TABLE anime ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';
    ALTER TABLE anime ADD COLUMN IF NOT EXISTS relations JSONB DEFAULT '[]';
    ALTER TABLE anime ADD COLUMN IF NOT EXISTS staff JSONB DEFAULT '[]';
    ALTER TABLE anime ADD COLUMN IF NOT EXISTS start_date VARCHAR(20);
    ALTER TABLE anime ADD COLUMN IF NOT EXISTS end_date VARCHAR(20);
  `;
  await pool.query(sql);
  console.log("Successfully added source, tags, relations, staff, start_date, and end_date columns!");
  await pool.end();
}

main().catch(console.error);
