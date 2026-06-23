/*
  AMOST database helper for server-side API routes.

  This helper uses Railway PostgreSQL through DATABASE_URL.
  It intentionally avoids importing pg types so the project can build even if
  @types/pg is not installed.
*/

type DbRow = Record<string, unknown>;

type DbResult<T extends DbRow> = {
  rows: T[];
  rowCount: number | null;
};

type DbPool = {
  query<T extends DbRow = DbRow>(
    text: string,
    params?: unknown[],
  ): Promise<DbResult<T>>;
};

declare global {
  // eslint-disable-next-line no-var
  var __amostPgPool: DbPool | undefined;
}

function getDatabaseUrl() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!url) {
    throw new Error("DATABASE_URL belum tersedia di Railway Variables.");
  }

  return url;
}

function shouldUseSsl(connectionString: string) {
  return (
    process.env.PGSSLMODE === "require" ||
    connectionString.includes("sslmode=require") ||
    connectionString.includes("ssl=true")
  );
}

function createPool(): DbPool {
  const connectionString = getDatabaseUrl();

  // Keep this as runtime require so TypeScript does not need @types/pg.
  // The npm package `pg` must still be installed in dependencies.
  const runtimeRequire = eval("require") as (moduleName: string) => any;
  const { Pool } = runtimeRequire("pg") as {
    Pool: new (config: Record<string, unknown>) => DbPool;
  };

  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: shouldUseSsl(connectionString)
      ? { rejectUnauthorized: false }
      : undefined,
  });
}

export function getAmostDbPool(): DbPool {
  if (!globalThis.__amostPgPool) {
    globalThis.__amostPgPool = createPool();
  }

  return globalThis.__amostPgPool;
}

export async function dbQuery<T extends DbRow = DbRow>(
  text: string,
  params: unknown[] = [],
): Promise<DbResult<T>> {
  return getAmostDbPool().query<T>(text, params);
}
