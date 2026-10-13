# PaCasa authentication on Base44

PaCasa's production target is **Base44**, not Vercel. PR #4 supplies the portal UX and Supabase PostgreSQL schema; this follow-up supplies the actual Base44 HTTP boundary.

## Request path

Browser portal -> `src/lib/authGateway.js` -> same-site `/functions/pacasaAuth?path=/api/auth/...` -> Base44 `entry.ts` -> Better Auth -> Supabase PostgreSQL. The Base44 function also handles `/api/portal/me`, `/api/portal/onboard`, and an opt-in `/assistant` translation route. It does not require a Next.js server. Existing `apps/web` auth routes remain development/tooling code, not the Base44 production endpoint.

The browser sends HttpOnly cookies with `credentials: include`. Native Better Auth calls use the Expo SecureStore plugin and the Base44 custom fetch transport. Non-auth native calls must explicitly await `getPaCasaSessionHeaders()` and use `credentials: omit`; do not assume browser cookies exist on native. Native transport tests do not substitute for an iOS/Android device sign-in test.

## Public app configuration

For the Base44 Vite app:

```env
VITE_PACASA_AUTH_URL=/functions/pacasaAuth
```

For native builds, set `EXPO_PUBLIC_PACASA_AUTH_URL` to the HTTPS **origin of the published Base44 app**. The client rewrites only approved authentication requests to the function. Neither variable is a vendor key or a database credential. A blank web setting retains the explicitly synthetic, browser-local preview; configuring a real endpoint never silently falls back to demo auth when a request fails.

Remote demo accounts use the normal login form. Their passwords are not bundled into the frontend and `VITE_PACASA_DEMO_PASSWORD` is no longer read by the gateway.

## Private Base44 function secrets

Configure these on the existing Base44 app, never in Vite/Expo public variables:

- `DATABASE_URL`: Supabase PostgreSQL connection URI (not a publishable/API key). Use the project's supported pooler/direct endpoint and verified TLS configuration.
- `BETTER_AUTH_SECRET`: at least 32 characters, generated securely.
- `BETTER_AUTH_URL`: the exact HTTPS app origin, with no path, query, credentials or fragment.
- `BETTER_AUTH_TRUSTED_ORIGINS`: optional comma-separated exact HTTPS origins. The handler already includes the app origin and the `pacasa://` native scheme; no wildcard origins.
- `PACASA_DB_CA_CERT`: the project's database CA PEM when required. Certificate verification is never disabled.

The function reads secrets inside each request. It has no hardcoded production credentials and never logs request text, session tokens or raw database errors.

## Schema setup is deliberate, not a request-time side effect

In the authorized PaCasa database, apply `supabase/bootstrap.sql`, migrate the pinned Better Auth schema (including its database-backed rate-limit table), then apply `supabase/seed.sql` and `supabase/base44-translation-limits.sql`. Run the existing controlled demo-account seed script with a privately supplied `PACASA_DEMO_PASSWORD`. The seed script refuses to attach a privileged fixture to a preexisting unbound account just because its email matches.

The automated integration test runs migrations **only** against a loopback database named `pacasa_ci` with an explicit test flag. No production Supabase migration is performed by CI in this workflow.

## Optional translation function

Disabled by default. Enabling requires `PACASA_ENABLE_DEMO_TRANSLATION=1`, `GEMINI_API_KEY`, and an explicit supported `GEMINI_MODEL`. The authenticated account must be active. Request JSON must contain `mode: translate`, `text`, opposite `en`/`es` source/target languages, and `consent: true`; it is bounded to 2,000 characters and 20 requests per account per minute. No audio or chat history is sent by this endpoint.

`translatePortalPhrase` exposes this contract to the Base44 frontend. A caller must present consent before invoking it; this change does not automatically authorize or reroute the legacy phrasebook screen. The cross-platform Talk workspace can target `https://<published-app-origin>/functions/pacasaAuth?path=/assistant`. Native Talk still needs the explicit session-header integration and physical-device acceptance test; configuring a URL alone is not authentication.

No PHI or clinical use is approved by enabling a demo flag. Vendor agreements, retention/consent review and qualified interpreter review are separate release gates.

## Executed verification

`Base44 auth integration` uses real Better Auth and an isolated PostgreSQL service, with Gemini mocked. It tests signup, password login, cookies, onboarding role immutability, pending providers, organization isolation, demo-profile takeover prevention, disabled-account denial, logout/session revocation, translation consent and rate limits. It also builds the actual root Vite Base44 surface. HTTP boundary tests check origin/route/body restrictions and multiple Set-Cookie preservation; native transport tests check cookie forwarding and fail-closed URLs.

These are repository/CI checks. **Not yet verified on the published Base44 platform:** function deployment, runtime npm resolution, custom-domain cookie forwarding, secret configuration, live Supabase connectivity, seeded-account sign-in, and native hardware. `/healthz` deliberately reports `databaseVerified: false`; it is not evidence of a successful database connection.

## Published-app acceptance check

Before enabling account creation, verify on the real Base44 origin: configured function -> TLS database connection -> patient signup/login -> pending provider -> server-approved provider sees only its organization -> refresh restores the session -> logout revokes it. Test denied/missing Origin, missing custom request header, disabled profiles, unauthenticated translation and body/rate limits. A Vercel preview is not evidence for these Base44 platform checks.

## Primary implementation references

- https://docs.base44.com/developers/backend/resources/backend-functions/overview
- https://docs.deno.com/examples/better_auth/
- https://better-auth.com/docs/adapters/postgresql
- https://better-auth.com/docs/concepts/rate-limit
- https://better-auth.com/docs/concepts/client
