import { Pool } from "pg";

const globalForPg = globalThis as unknown as {
  amostPgPool?: Pool;
};

export function getPgPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL belum tersedia. Pastikan Railway PostgreSQL sudah terhubung ke service website.");
  }

  if (!globalForPg.amostPgPool) {
    globalForPg.amostPgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : undefined,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return globalForPg.amostPgPool;
}

export function safeNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function safeString(value: unknown, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}
