import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { betterAuth } from 'better-auth';
import { getMigrations } from 'better-auth/db/migration';
import { expo } from '@better-auth/expo';
import { Pool } from 'pg';
import { PostgresDialect } from 'kysely';
import { authOptions, createGateway, readConfig } from '../../../base44/functions/pacasaAuth/gateway.js';

const connectionString = process.env.DATABASE_URL;
const target = new URL(connectionString || 'postgres://invalid/invalid');
if (process.env.PACASA_AUTH_INTEGRATION_TEST !== '1' || !['localhost', '127.0.0.1'].includes(target.hostname) || target.pathname !== '/pacasa_ci') {
  throw new Error('This fixture test is restricted to an explicit loopback pacasa_ci database.');
}
const db = new Pool({ connectionString });
const env = { DATABASE_URL: connectionString, BETTER_AUTH_SECRET: randomBytes(48).toString('hex'), BETTER_AUTH_URL: 'https://pacasa.example.test' };
const getSecret = (name) => env[name];
const config = readConfig(getSecret);
let calls = 0;
try {
  await db.query("do $$ begin if not exists (select 1 from pg_roles where rolname='anon') then create role anon; end if; if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if; end $$;");
  for (const path of ['bootstrap.sql', 'seed.sql', 'base44-translation-limits.sql']) {
    await db.query(await readFile(new URL('../../../supabase/' + path, import.meta.url), 'utf8'));
  }
  const auth = betterAuth({ ...authOptions(config, { dialect: new PostgresDialect({ pool: db }), type: 'postgres', schemaName: 'better_auth' }), plugins: [expo()] });
  const migrations = await getMigrations(auth.options);
  await migrations.runMigrations();
  const handler = createGateway({ getSecret, runtimeFactory: () => ({ auth, db }), fetchImpl: async () => {
    calls += 1;
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ reply: 'Hello' }) }] } }] });
  } });
  const password = randomBytes(24).toString('base64url');
  async function call(jar, path, body, expected = 200) {
    const response = await handler(new Request(config.publicOrigin + '/functions/pacasaAuth?path=' + encodeURIComponent(path), {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Origin: config.publicOrigin, 'Content-Type': 'application/json', 'X-PaCasa-Request': '1',
        Cookie: [...jar.entries()].map(([key, value]) => key + '=' + value).join('; '), 'x-forwarded-for': '192.0.2.1' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }));
    const result = await response.json();
    assert.equal(response.status, expected, path + ': ' + JSON.stringify(result));
    assert.equal(response.headers.get('cache-control'), 'no-store');
    for (const cookie of response.headers.getSetCookie()) {
      const [pair] = cookie.split(';');
      const split = pair.indexOf('=');
      jar.set(pair.slice(0, split), pair.slice(split + 1));
      assert.match(cookie, /HttpOnly/i);
      assert.match(cookie, /Secure/i);
    }
    return result;
  }
  async function register(email, accountType, organizationSlug) {
    const jar = new Map();
    const created = await call(jar, '/api/auth/sign-up/email', { name: 'Synthetic CI User', email, password });
    await call(jar, '/api/auth/sign-in/email', { email, password });
    const session = await call(jar, '/api/auth/get-session');
    assert.equal(session.user.id, created.user.id);
    const { profile } = await call(jar, '/api/portal/onboard', { accountType, organizationSlug, status: 'active', role: 'admin' });
    return { jar, userId: created.user.id, profile };
  }
  const patient = await register('new-patient@demo.pacasa.test', 'patient');
  assert.equal(patient.profile.status, 'active');
  const retry = await call(patient.jar, '/api/portal/onboard', { accountType: 'provider', organizationSlug: 'clinica-san-miguel' });
  assert.equal(retry.profile.accountType, 'patient');
  console.log('PASS signup, password sign-in, cookie session and immutable onboarding role');

  const first = await register('new-provider@demo.pacasa.test', 'provider', 'clinica-san-miguel');
  assert.equal(first.profile.status, 'pending');
  assert.deepEqual((await call(first.jar, '/api/portal/me')).organizations, []);
  const second = await register('other-provider@demo.pacasa.test', 'provider', 'centro-esperanza');
  await db.query("update app.profiles set status='active' where id in ($1,$2)", [first.profile.id, second.profile.id]);
  await db.query("update app.provider_memberships set status='active' where provider_profile_id in ($1,$2)", [first.profile.id, second.profile.id]);
  const firstOrgs = (await call(first.jar, '/api/portal/me')).organizations;
  const secondOrgs = (await call(second.jar, '/api/portal/me')).organizations;
  assert.equal(firstOrgs.length, 1);
  assert.equal(secondOrgs.length, 1);
  assert.notEqual(firstOrgs[0].id, secondOrgs[0].id);
  await db.query("insert into app.provider_memberships (provider_profile_id,organization_id,status) values ($1,$2,'pending')", [first.profile.id, secondOrgs[0].id]);
  assert.equal((await call(first.jar, '/api/portal/me')).organizations.length, 1);
  console.log('PASS pending provider denial, explicit activation and organization isolation');

  const takeover = new Map();
  await call(takeover, '/api/auth/sign-up/email', { name: 'Synthetic attempted claimant', email: 'elena.ruiz@demo.pacasa.test', password });
  assert.equal((await call(takeover, '/api/portal/me')).profile, null);
  console.log('PASS preseeded provider cannot be claimed through an email match');

  await call(patient.jar, '/assistant', { mode: 'translate', text: 'Hola', sourceLanguage: 'es', targetLanguage: 'en', consent: true }, 503);
  assert.equal(calls, 0);
  env.PACASA_ENABLE_DEMO_TRANSLATION = '1'; env.GEMINI_API_KEY = 'test-only-not-a-real-vendor-key'; env.GEMINI_MODEL = 'test-model';
  await call(patient.jar, '/assistant', { mode: 'translate', text: 'Hola', sourceLanguage: 'es', targetLanguage: 'en' }, 400);
  const result = await call(patient.jar, '/assistant', { mode: 'translate', text: 'Hola', sourceLanguage: 'es', targetLanguage: 'en', consent: true });
  assert.equal(result.reply, 'Hello'); assert.equal(calls, 1);
  await db.query("update app.translation_limits set window_started=date_trunc('minute',now()), request_count=20 where auth_user_id=$1", [patient.userId]);
  await call(patient.jar, '/assistant', { mode: 'translate', text: 'Hola', sourceLanguage: 'es', targetLanguage: 'en', consent: true }, 429);
  assert.equal(calls, 1);
  console.log('PASS translation disabled by default, consent and database quota; Gemini mocked');

  await db.query("update app.profiles set status='disabled' where id=$1", [patient.profile.id]);
  await call(patient.jar, '/api/portal/me', undefined, 403);
  await call(patient.jar, '/api/portal/onboard', { accountType: 'patient' }, 403);
  await call(patient.jar, '/api/auth/sign-out', {});
  await call(patient.jar, '/api/portal/me', undefined, 401);
  console.log('PASS disabled account denial and real session revocation on logout');
  console.log('Base44 gateway integration passed against real Better Auth and local PostgreSQL; no live Base44/Supabase deployment or clinical validation claimed.');
} finally { await db.end(); }
