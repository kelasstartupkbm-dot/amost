import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var amostDbPool: Pool | undefined;
}

export function getDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!globalThis.amostDbPool) {
    globalThis.amostDbPool = new Pool({
      connectionString,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    });
  }

  return globalThis.amostDbPool;
}
