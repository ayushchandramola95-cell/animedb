import { Pool } from "pg";

// Global database connection pool
declare global {
  // eslint-disable-next-line no-var
  var __dbPool: Pool | undefined;
}

function getDatabaseConfig() {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    return {
      connectionString,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };
  }

  return {
    host: process.env.DB_HOST || "35.194.28.236",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "postgres",
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
}

export function getPool(): Pool {
  if (!global.__dbPool) {
    const config = getDatabaseConfig();
    global.__dbPool = new Pool(config);

    global.__dbPool.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client", err);
    });
  }
  return global.__dbPool;
}

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  const pool = getPool();
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === "development" && duration > 100) {
      console.log(`[DB Slow Query] ${duration}ms: ${text.slice(0, 80)}`);
    }
    return { rows: res.rows, rowCount: res.rowCount };
  } catch (error) {
    console.error("[DB Query Error]:", error);
    throw error;
  }
}
