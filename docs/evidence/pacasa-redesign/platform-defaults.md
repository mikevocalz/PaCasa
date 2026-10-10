# docs/evidence/pacasa-redesign/platform-defaults.md

## Brief received

Lane: platform metadata/defaults for the Pa'Casa healthcare direction (ADR 0002).
Owned paths: `apps/web/app/layout.tsx`, `apps/web/app/Document.tsx`,
`apps/web/app/globals.css`, `apps/mobile/app/_layout.tsx`, this evidence file.
Requirements: Spanish-first web metadata, `lang="es"` + daylit default scheme in
Document, dead starter CSS removal + calm semantic scrollbar tokens in
globals.css, system theme / daylit StatusBar / token-derived light
`contentStyle` on mobile. `app.config.ts`, routes, `packages/*` and manifests
explicitly out of scope. No commits.

## Sources read

- `apps/web/app/layout.tsx` — `metadata` (Next `Metadata` export)
- `apps/web/app/Document.tsx` — `Document`, `THEME_SCRIPT` cookie reader
- `apps/web/app/globals.css` — full file
- `apps/mobile/app/_layout.tsx` — `RootLayout`
- `apps/mobile/app.config.ts` — read for contract context only; not edited
- `packages/theme/tokens.ts` — `semantic` (semantic color pairs), `palette`
- `packages/theme/index.ts` — `export * from './tokens.ts'` (exposes `semantic`)
- `packages/theme/switch.ts`, `switch.web.ts`, `switch.native.ts` —
  `setThemePreference('system')` → `Appearance.setColorScheme('unspecified')`
- `packages/theme/theme.css` — `color-scheme: light` is the `:root` default
  ("daylit by default, canon Decision #4"); `[data-theme='light'|'dark'|'system']`
  overrides; `--color-text-muted`/`--color-text-secondary`/`--color-surface` exist
- `node_modules/expo-status-bar@58.0.3/build/types.d.ts` —
  `StatusBarStyle = 'auto' | 'inverted' | 'light' | 'dark'`; `'auto'` follows
  the app appearance (dark UI → light content). `'auto'` is the correct
  system-following choice for Expo 58.
- `docs/adr/0002-pacasa-healthcare-route-map.md`, `AGENTS.md`,
  `apps/web/AGENTS.md` (Next-16 rules note; no API shape in this lane changed —
  `Metadata` string fields only)

Dead-code verification (repo-wide grep before deletion):

- `gallery-slide` → only in `globals.css` (no consumer)
- `site-page`, `site-header`, `view-transition-name`, `viewTransitionName` →
  only in `globals.css` (`next.config.ts` has a comment noting `<ViewTransition>`
  needs no config in Next 16.3, but nothing renders a named transition)
- `motion-armed`, `mfx-` → only in `globals.css`; the referenced
  `apps/web/components/home/motion.ts` does not exist
- `short:` variant → still consumed by `packages/app/screens/AppShell.tsx`
  (6 matches); kept

## Skills ledger

| Skill | Path | Loaded |
| --- | --- | --- |
| (none declared for this lane) | — | — |

## Changes

- `apps/web/app/layout.tsx` — `metadata.description` now describes Spanish-first
  clinic-visit help instead of the spatial starter
  ("Pa'Casa te ayuda en español a preparar tu visita a la clínica: llena
  formularios, revisa documentos y confirma tus respuestas antes de tu cita.").
  Title/template unchanged.
- `apps/web/app/Document.tsx` — `<html lang="es" data-theme="light" …>` (was
  `lang="en" data-theme="dark"`). Cookie `THEME_SCRIPT` and
  `suppressHydrationWarning` preserved unchanged.
- `apps/web/app/globals.css` —
  - Removed dead starter CSS: `.gallery-slide` + `gallery-slide-enter`
    keyframes; all `site-page`/`site-header` `::view-transition-*` rules and
    their `site-page-exit`/`site-page-enter` keyframes; the
    `prefers-reduced-motion` view-transition block (dead with the transitions);
    the `.motion-armed [id^='mfx-']` block (its motion layer was deleted).
  - Scrollbar colors retokenized from starter brand steps
    (`--color-royal-600`, `--color-primary`) to calm semantic tokens
    (`--color-text-muted` thumb, `--color-text-secondary` hover).
  - Preserved: `@import 'tailwindcss' important`, `@acme/theme/theme.css`,
    lenis import, `@source` globs, `short:` custom variant, scroll-padding,
    RNW flex fix (`body main[role='main']`), text-wrap/body rules, and the
    four RNW hashed-class SSR fallback rules.
- `apps/mobile/app/_layout.tsx` —
  - `setThemePreference('system')` replaces `setThemePreference('dark')`
    (native fork maps to `Appearance.setColorScheme('unspecified')`).
  - `StatusBar style="auto"` (follows the resolved scheme) replaces `"light"`.
  - `Stack contentStyle.backgroundColor` now `semantic.bg.light`
    (`concrete[50]`, `#F3F4F4`, from `@acme/theme`) replaces hardcoded `"#000"`.
  - Preserved: `GestureRoot`/`withUniwind`, `SafeAreaProvider`,
    `KeyboardProvider`, `AppShell`, `Stack headerShown:false` — no
    window/navigation contract touched.

## Commands run + results

| Command | Result |
| --- | --- |
| `cd apps/mobile && pnpm typecheck` (`tsc --noEmit`) | PASS (exit 0) |
| `cd apps/web && pnpm typecheck` (`tsc --noEmit`) | PASS (exit 0) |
| `cd apps/web && pnpm exec eslint app/layout.tsx app/Document.tsx` | PASS (exit 0, no findings) |
| `cd apps/mobile && pnpm exec eslint app/_layout.tsx` | PASS (exit 0, no findings) |

`pnpm install --frozen-lockfile` was effectively exercised by `pnpm typecheck`'s
workspace resolution (lockfile verified, postinstall scripts completed).

## Device evidence

NOT VERIFIED — no simulator/emulator/device or browser was run in this lane.
Changes are static defaults only; no runtime claim is made for iOS, Android,
Quest/PICO window behavior, or web paint.

## Open questions / blockers

- `switch.web.ts` documents "No attribute = the brand default (dark)" — the
  default has deliberately flipped to daylit per the healthcare direction, so
  that comment (in `packages/theme`, outside this lane) is now stale.
- `@acme/theme` brand copy (`tokens.ts` header, NYC Mon naming) still describes
  the sports brand; token *names* stay stable, but a later lane may want to
  re-skin values. Not a blocker — tokens are consumed by name.
- `apps/mobile` still imports the NYC-Mon fonts and splash config via
  `app.config.ts` (user-owned, uncommitted logo changes — untouched per brief).

## Requests to other lanes

- Theme lane (`packages/theme`): update the stale `switch.web.ts` comment about
  the dark default, and consider whether `semantic.bg.light` should get a
  dedicated `contentStyle`-friendly export name.
- UX/copy lane: confirm the Spanish metadata description reads correctly for
  the clinic audience; `lang="es"` is set but most in-app copy remains English
  until screen lanes land.
