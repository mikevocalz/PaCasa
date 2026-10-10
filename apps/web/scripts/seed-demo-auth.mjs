import { betterAuth } from 'better-auth';
import { PostgresDialect } from 'kysely';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const secret = process.env.BETTER_AUTH_SECRET;
const password = process.env.PACASA_DEMO_PASSWORD;

if (!connectionString || !secret || !password) {
  throw new Error('DATABASE_URL, BETTER_AUTH_SECRET, and PACASA_DEMO_PASSWORD are required.');
}

const pool = new Pool({ connectionString, max: 2 });
const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret,
  database: {
    dialect: new PostgresDialect({ pool }),
    type: 'postgres',
    schemaName: 'better_auth',
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
  },
});

const users = [
  { name: 'Rosa Velázquez', email: 'rosa.patient@demo.pacasa.test' },
  { name: 'Elena Martínez', email: 'elena.patient@demo.pacasa.test' },
  { name: 'Carlos Rivera', email: 'carlos.patient@demo.pacasa.test' },
  { name: 'Dra. Elena Ruiz', email: 'elena.ruiz@demo.pacasa.test' },
  { name: 'Ana Morales', email: 'ana.morales@demo.pacasa.test' },
  { name: 'Dr. Luis Torres', email: 'luis.torres@demo.pacasa.test' },
];

for (const fixture of users) {
  let existing = await pool.query(
    'select id, email from better_auth."user" where lower(email) = lower($1) limit 1',
    [fixture.email],
  );

  if (!existing.rows[0]) {
    await auth.api.signUpEmail({
      body: {
        name: fixture.name,
        email: fixture.email,
        password,
      },
    });
    existing = await pool.query(
      'select id, email from better_auth."user" where lower(email) = lower($1) limit 1',
      [fixture.email],
    );
  }

  const authUser = existing.rows[0];
  if (!authUser) throw new Error(`Could not resolve Better Auth user for ${fixture.email}`);

  await pool.query(
    `update app.profiles
        set auth_user_id = $1,
            updated_at = now()
      where is_demo = true
        and lower(demo_email) = lower($2)`,
    [authUser.id, fixture.email],
  );

  console.log(`seeded ${fixture.email}`);
}

console.log('Demo password:', password);
await pool.end();
