import { auth } from '../lib/auth.ts';
import { db, databaseConfigured } from '../lib/database.ts';

const password = process.env.PACASA_DEMO_PASSWORD ?? 'PaCasa-Demo-2026!';

const users = [
  { name: 'Rosa Velázquez', email: 'rosa.patient@demo.pacasa.test' },
  { name: 'Elena Martínez', email: 'elena.patient@demo.pacasa.test' },
  { name: 'Carlos Rivera', email: 'carlos.patient@demo.pacasa.test' },
  { name: 'Dra. Elena Ruiz', email: 'elena.ruiz@demo.pacasa.test' },
  { name: 'Ana Morales', email: 'ana.morales@demo.pacasa.test' },
  { name: 'Dr. Luis Torres', email: 'luis.torres@demo.pacasa.test' },
];

if (!databaseConfigured || !process.env.BETTER_AUTH_SECRET) {
  throw new Error('DATABASE_URL and BETTER_AUTH_SECRET are required before seeding demo auth users.');
}

for (const fixture of users) {
  const existing = await db.query(
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
  }

  const created = await db.query(
    'select id, email from better_auth."user" where lower(email) = lower($1) limit 1',
    [fixture.email],
  );
  if (!created.rows[0]) throw new Error(`Could not resolve seeded Better Auth user for ${fixture.email}`);

  await db.query(
    `update app.profiles
        set auth_user_id = $1,
            updated_at = now()
      where is_demo = true
        and lower(demo_email) = lower($2)`,
    [created.rows[0].id, fixture.email],
  );

  console.log(`seeded ${fixture.email}`);
}

await db.end();
