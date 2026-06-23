let cachedPool: any = null;

export function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.RAILWAY_DATABASE_URL ||
    ""
  );
}

export function getPool() {
  if (cachedPool) return cachedPool;

  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Pool } = require("pg");

  cachedPool = new Pool({
    connectionString: databaseUrl,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

  return cachedPool;
}

export async function dbQuery(text: string, params: unknown[] = []) {
  const pool = getPool();
  return pool.query(text, params);
}
