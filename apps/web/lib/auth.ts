import 'server-only';

import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { PostgresDialect } from 'kysely';
import { db, databaseConfigured } from './database';

const trustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const runtimeConfigured = databaseConfigured && Boolean(process.env.BETTER_AUTH_SECRET);

export const authRuntimeConfigured = runtimeConfigured;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret:
    process.env.BETTER_AUTH_SECRET ??
    'pacasa-build-only-placeholder-secret-do-not-deploy',
  database: {
    dialect: new PostgresDialect({ pool: db }),
    type: 'postgres',
    schemaName: 'better_auth',
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
  },
  trustedOrigins,
  plugins: [expo()],
  advanced: {
    database: {
      joins: true,
    },
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
});
