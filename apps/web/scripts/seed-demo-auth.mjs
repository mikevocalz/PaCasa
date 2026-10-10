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
  const existing = await pool.query(
    'select id from better_auth."user" where lower(email) = lower($1) limit 1',
    [fixture.email],
  );

  const fixtureProfile = await pool.query(
    'select id, auth_user_id from app.profiles where is_demo = true and lower(demo_email) = lower($1) limit 1',
    [fixture.email],
  );
  if (!fixtureProfile.rows[0]) throw new Error(`Missing seeded profile for ${fixture.email}`);

  if (existing.rows[0]) {
    // Email alone proves no account ownership. Never attach privileged demo profiles
    // to an account that somebody created before the trusted seeding operation.
    if (fixtureProfile.rows[0].auth_user_id !== existing.rows[0].id) {
      throw new Error(`A prior unbound account exists for ${fixture.email}; stop and investigate`);
    }
    console.log(`verified previously bound demo fixture ${fixture.email}`);
    continue;
  }

  const created = await auth.api.signUpEmail({
    body: { name: fixture.name, email: fixture.email, password },
  });
  const newId = created?.user?.id;
  if (!newId) throw new Error(`Could not create Better Auth user for ${fixture.email}`);

  const bound = await pool.query(
    `update app.profiles
        set auth_user_id = $1,
            updated_at = now()
      where id = $2
        and is_demo = true
        and auth_user_id like 'demo-%'
      returning id`,
    [newId, fixtureProfile.rows[0].id],
  );
  if (bound.rowCount !== 1) {
    throw new Error(`Fixture for ${fixture.email} was already bound or unexpectedly changed`);
  }
  console.log(`seeded demo user ${fixture.email}`);
}

await pool.end();
