# Pa'Casa authentication and portal integration

## Decision

Pa'Casa uses **Better Auth backed by Supabase Postgres**.

- Supabase provides PostgreSQL.
- Better Auth owns identity/session tables.
- We do **not** use Supabase Auth.
- We do **not** use Neon.
- The Base44/Vite experience stays the hackathon-facing UI and calls the auth backend through `VITE_PACASA_AUTH_URL`.
- The role model lives in Pa'Casa domain tables, not mutable client metadata.

This follows the same split used in Harlem Might (shared auth UI + Better Auth identity), while replacing Harlem Might's Neon/Payload persistence with Supabase Postgres.

## Database schemas

Supabase already reserves the `auth` schema, so Better Auth must not use it.

- `better_auth`: Better Auth core tables (user, session, account, verification, plugin tables).
- `app`: Pa'Casa organizations, profiles and memberships.

Run `supabase/bootstrap.sql` first. Then configure Better Auth's PostgreSQL adapter to use `search_path=better_auth` (or `database.schemaName = "better_auth"`) before running the Better Auth 1.7.7 migration.

## Account model

### Patient

Patient signup is allowed to activate immediately.

Patient portal:

1. Inicio
2. Formularios
3. raised Pa'Casa center action
4. Documentos
5. Revisar

### Provider

Provider signup records intent, but **must not grant provider access simply because the client selected "provider"**.

A provider profile begins `pending` unless the user is already seeded/invited/approved into an organization.

Provider portal:

1. Inicio
2. Pacientes
3. raised Pa'Casa center action
4. Formularios
5. Pendientes

Overflow belongs in the left drawer.

## Authorization rule

Never authorize from Better Auth user fields that the browser can choose at signup.

Use:

- Better Auth user id -> `app.profiles.auth_user_id`
- `app.profiles.account_type`
- `app.profiles.status`
- `app.provider_memberships`
- `app.patient_organization_links`

The provider portal must only query patients linked to organizations where the provider has an active membership.

## Demo fixtures

The database seeds three fictional organizations:

1. Clínica San Miguel — Bronx
2. Centro de Salud Esperanza — Washington Heights
3. Hospital Comunitario La Familia — East Harlem

It also seeds three fictional patients and three fictional provider profile fixtures.

The fixture `auth_user_id` values intentionally match the Base44/Vite local demo sessions. Once Better Auth is connected, create Better Auth users for the demo emails and replace the fixture IDs with the real Better Auth user IDs.

No real hospital affiliation is implied.

## Better Auth configuration

Use Better Auth **1.7.7** and keep all `@better-auth/*` packages on the same version.

Recommended server setup:

```ts
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    options: "-c search_path=better_auth",
  }),
  emailAndPassword: { enabled: true },
});
```

For Expo/mobile, use `@better-auth/expo` plus `expo-secure-store`; never put session tokens in Zustand persistence or AsyncStorage.

## Supabase project handoff (2026-10-10)

The Pa'Casa project has been identified as:

- Project reference: `bjkphdrwnctszwrrqecx`
- Project API URL: `https://bjkphdrwnctszwrrqecx.supabase.com`
- Supabase dashboard: https://supabase.com/dashboard/project/bjkphdrwnctszwrrqecx
- Public publishable key: present in the root, Expo, and Next `.env.example` files. It may be exposed in client bundles; it **does not grant users a Better Auth session**.

**Do not confuse the three types of credential:**

| Input | Role | Where it belongs |
| --- | --- | --- |
| Supabase API URL + `sb_publishable_...` | Optional Supabase Data API client | Public Vite/Expo/Next configuration, with RLS |
| `sb_secret_...` | Privileged Supabase Data API key; bypasses RLS | Server-side secret store only; **not needed for Better Auth's Postgres adapter** |
| `postgresql://...` connection URI | Actual PostgreSQL database connection | `DATABASE_URL` on the trusted Better Auth/Next server only |

The Supabase secret key supplied during handoff was **not committed, logged, or placed in the frontend**. Rotate that key in the Supabase dashboard because it was shared in conversation, then store a newly issued key only if a trusted backend actually needs Supabase Data API admin access.

For the current Better Auth architecture the remaining connection requirement is the **Postgres URI**, including its separately generated database password. Retrieve it from Supabase **Connect > Connection string** (direct connection or session pooler, depending on hosting), and store it as `DATABASE_URL` on the server. Neither the publishable key nor the secret key can substitute for it.

Once server environment variables are installed, run this **read-only** check before migrating or seeding:

```bash
pnpm --filter web auth:doctor
```

The checker confirms basic configuration and `SELECT 1` connectivity, rejects API keys/HTTPS URLs mistaken for `DATABASE_URL`, checks for a different Supabase project reference when detectable, and never prints credentials. Success does **not** prove tables are migrated or provider isolation is correct; follow the migration, seed, and portal checks below.

**Base44 deployment:** the browser app must use `VITE_PACASA_AUTH_URL` pointing to the deployed Pa'Casa Better Auth API, **not** the Supabase `https://...supabase.com` REST endpoint. The Next.js auth API cannot be served by a static Base44 export. Include `https://pacasa-83490010.base44.app` in `BETTER_AUTH_TRUSTED_ORIGINS` on the server.

## Environment contract

Base44/Vite:

```
VITE_PACASA_AUTH_URL=https://auth-or-web-host.example
```

Auth server:

```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://auth-or-web-host.example
BETTER_AUTH_TRUSTED_ORIGINS=https://your-base44-host.example,https://your-web-host.example
```

Use Supabase's direct connection for a persistent backend, or its session pooler if the deployment environment needs IPv4/shared pooling.

## Static Base44 build

Do not place database secrets in the Vite bundle.

The Base44 surface only knows the public Better Auth backend origin. All database access and provider authorization stays server-side.

Until `VITE_PACASA_AUTH_URL` is configured, the UI exposes explicit demo-only patient/provider session buttons so product work and judging flows stay testable.

## Setup sequence for the coworker attaching Supabase

1. Create/link the Supabase project.
2. Run `supabase/bootstrap.sql`.
3. Configure the Better Auth Postgres connection to the Supabase `DATABASE_URL`.
4. Run Better Auth 1.7.7 migrations into `better_auth`.
5. Run `supabase/seed.sql`.
6. Create the six Better Auth demo users.
7. Reconcile `app.profiles.auth_user_id` to the actual Better Auth user ids.
8. Configure `VITE_PACASA_AUTH_URL`.
9. Verify patient login routes to the patient portal.
10. Verify seeded provider login routes to the provider portal.
11. Verify a newly-created provider remains pending until approved.


## Implemented in PR #4

The integration is no longer only a scaffold:

- Better Auth 1.7.7 is pinned in the workspace.
- `@better-auth/expo` 1.7.7 is pinned for native.
- Expo SecureStore is configured for native session/cookie storage.
- `pg` + Kysely back Better Auth against Supabase Postgres.
- Better Auth is mounted at `/api/auth/[...all]`.
- `/api/portal/me` returns the server-owned Pa'Casa profile and organizations.
- `/api/portal/onboard` creates patients as active and providers as pending.
- Demo fixture emails automatically reconcile to the real Better Auth user id.
- `pnpm --filter web auth:seed-demo` creates the six synthetic Better Auth identities.
- Base44/Vite quick demo login uses the real seeded Better Auth accounts whenever `VITE_PACASA_AUTH_URL` is configured.

### Demo credentials

These accounts contain synthetic data only:

- Patient: `rosa.patient@demo.pacasa.test`
- Provider: `elena.ruiz@demo.pacasa.test`
- Default demo password: `PaCasa-Demo-2026!`

Override the password during seeding with `PACASA_DEMO_PASSWORD` if desired.

### Cross-origin Base44 note

For a Base44 origin that differs from the Better Auth API origin, set:

```
BETTER_AUTH_CROSS_ORIGIN=1
BETTER_AUTH_TRUSTED_ORIGINS=https://<base44-origin>,https://<other-approved-origin>
```

This enables secure `SameSite=None` cookies plus a strict CORS allowlist. For a production Safari-safe deployment, prefer a same-origin reverse proxy or shared parent domain instead of permanent third-party cookies.
