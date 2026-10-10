import 'server-only';

import { Pool } from 'pg';

export const databaseConfigured = Boolean(process.env.DATABASE_URL);

const connectionString =
  process.env.DATABASE_URL ??
  // Build-only placeholder. Portal/auth routes reject requests when
  // DATABASE_URL is missing, so this is never a production fallback.
  'postgresql://pacasa_build:pacasa_build@127.0.0.1:5432/pacasa_build';

const globalForPg = globalThis as typeof globalThis & { __pacasaPgPool?: Pool };

export const db =
  globalForPg.__pacasaPgPool ??
  new Pool({
    connectionString,
    max: Number(process.env.PG_POOL_MAX ?? 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== 'production') globalForPg.__pacasaPgPool = db;
