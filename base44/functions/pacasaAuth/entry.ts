import { secrets } from 'base44:runtime';
import { betterAuth } from 'npm:better-auth@1.7.7';
import { expo } from 'npm:@better-auth/expo@1.7.7';
// @deno-types="npm:@types/pg@8.23.1"
import { Pool } from 'npm:pg@8.23.1';
import { PostgresDialect } from 'npm:kysely@0.29.6';
import { authOptions, createGateway } from './gateway.js';

// Base44 resolves secrets per request. Never initialize auth from public/build-time variables.
export default async function (request: Request): Promise<Response> {
  let pool: Pool | undefined;
  const handler = createGateway({
    getSecret: (name: string) => secrets.get(name),
    runtimeFactory: (config: Parameters<typeof authOptions>[0]) => {
      pool = new Pool({ connectionString: config.connectionString, max: 2,
        ssl: { rejectUnauthorized: true, ca: secrets.get('PACASA_DB_CA_CERT') },
        connectionTimeoutMillis: 8000, idleTimeoutMillis: 1000,
        statement_timeout: 15000 });
      const options = authOptions(config, {
        dialect: new PostgresDialect({ pool }), type: 'postgres', schemaName: 'better_auth',
      });
      return { db: pool, auth: betterAuth({ ...options, plugins: [expo()] }) };
    },
  });
  try { return await handler(request); }
  finally { await pool?.end(); }
}
