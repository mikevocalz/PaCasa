#!/usr/bin/env node
/**
 * Pa'Casa Better Auth / Supabase Postgres connection doctor.
 *
 * Safe and read-only: validates environment inputs, then runs SELECT 1.
 * Does not print a connection string, password, token, or database contents.
 *
 * From the workspace root:
 *   pnpm --filter web auth:doctor
 */
import { Pool } from 'pg';

const EXPECTED_PROJECT_REF = 'bjkphdrwnctszwrrqecx';
const issues = [];
const warnings = [];

const connectionString = process.env.DATABASE_URL?.trim() ?? '';
const authSecret = process.env.BETTER_AUTH_SECRET ?? '';
const authUrl = process.env.BETTER_AUTH_URL ?? '';
const trustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

let databaseUrl;
if (!connectionString) {
  issues.push('DATABASE_URL is missing. Obtain a PostgreSQL connection string from Supabase > Connect.');
} else {
  try {
    databaseUrl = new URL(connectionString);
    if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
      issues.push('DATABASE_URL must be a postgresql:// connection string, not a Supabase API key or HTTPS URL.');
      databaseUrl = null;
    } else if (!databaseUrl.hostname || !databaseUrl.username || !databaseUrl.password || !databaseUrl.pathname.slice(1)) {
      issues.push('DATABASE_URL is missing a database host, user, password, or database name.');
    } else {
      const host = databaseUrl.hostname.toLowerCase();
      // Both direct-db and pooled Supabase connections are supported.
      const directProjectRef = host.startsWith('db.') && host.endsWith('.supabase.co')
        ? host.slice(3, -'.supabase.co'.length)
        : null;
      const poolerProjectRef = host.endsWith('.pooler.supabase.com') && databaseUrl.username.startsWith('postgres.')
        ? databaseUrl.username.slice('postgres.'.length)
        : null;
      const linkedProjectRef = directProjectRef ?? poolerProjectRef;
      if (linkedProjectRef && linkedProjectRef !== EXPECTED_PROJECT_REF) {
        issues.push('DATABASE_URL belongs to a different Supabase project. Check the Pa\'Casa project reference.');
      }
      if (!linkedProjectRef) {
        warnings.push('Could not confirm the Supabase project from the connection host/user; double-check the connection target.');
      }
    }
  } catch {
    issues.push('DATABASE_URL is malformed. Use the PostgreSQL URI from Supabase > Connect.');
  }
}

if (!authSecret || authSecret.length < 32) {
  issues.push('BETTER_AUTH_SECRET must be configured with a separate random value of at least 32 characters.');
}
if (!authUrl) {
  issues.push('BETTER_AUTH_URL must point to the running Pa\'Casa Next.js auth server.');
} else {
  try {
    const url = new URL(authUrl);
    const isLocal = ['localhost', '127.0.0.1'].includes(url.hostname);
    if (!['http:', 'https:'].includes(url.protocol) || (!isLocal && url.protocol !== 'https:')) {
      issues.push('BETTER_AUTH_URL must be HTTPS outside local development.');
    }
    if (url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.supabase.com')) {
      issues.push('BETTER_AUTH_URL must point to the Pa\'Casa auth server, not the Supabase REST API.');
    }
  } catch {
    issues.push('BETTER_AUTH_URL is not a valid URL.');
  }
}
if (!trustedOrigins.length) {
  issues.push('BETTER_AUTH_TRUSTED_ORIGINS must include the Pa\'Casa Base44/web origins.');
} else if (!trustedOrigins.includes('https://pacasa-83490010.base44.app')) {
  warnings.push('Base44 origin is not present in BETTER_AUTH_TRUSTED_ORIGINS; hosted browser login may be blocked.');
}

for (const warning of warnings) console.warn('[auth:doctor] Warning:', warning);
if (issues.length) {
  for (const issue of issues) console.error('[auth:doctor]', issue);
  process.exitCode = 1;
} else {
  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 8000, idleTimeoutMillis: 1000 });
  try {
    await pool.query('SELECT 1');
    console.log('[auth:doctor] Supabase PostgreSQL is reachable, and Better Auth environment values are present.');
    console.log('[auth:doctor] This does not verify migrations, credentials for app users, or provider RLS.');
  } catch (error) {
    // Do not leak the connection string or credentials in database error messages.
    const code = /^[A-Z0-9_]{2,12}$/.test(String(error?.code ?? '')) ? error.code : 'CONNECTION_FAILED';
    console.error('[auth:doctor] Database connectivity check failed (' + code + ').');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
