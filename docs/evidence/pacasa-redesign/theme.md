# Evidence: theme lane — Pa'Casa healthcare redesign

## Brief received

Lane: `@acme/theme` tokens and generated docs for the Pa'Casa healthcare
direction (ADR 0002). Owned paths: `packages/theme/tokens.ts`,
`packages/theme/contrast.ts`, `packages/theme/theme.css`,
`packages/theme/theme-native.css`, `docs/DESIGN_SYSTEM.md`,
`docs/design/CONTRAST.md`, this evidence file. Requirements: calm daylit
healthcare direction while preserving every token name and public API;
warm daylit light scheme with white raised cards, dark text, calm blue/teal
accent and CTA (carolina/royal/leaf preferred; no orange body text, no neon
effect); dark scheme stays usable without app-facing neon glows (shadows →
soft elevation; `glow-*` tokens may remain for legacy kit); body ≥17 pt
(prefer 18), labels ≥15–16 pt, nothing below the existing floor; opt-in
soft/card/sheet radii to a gentle radius; every changed semantic text/UI
pair re-measured without weakened thresholds; regenerate committed CSS with
`build-css.mjs`; run theme tests and typecheck. No commits, no edits outside
the owned paths.

## Sources read

- `AGENTS.md` — spatial starter contracts (carried forward unchanged)
- `docs/adr/0002-pacasa-healthcare-route-map.md` — route map and safety
  requirements for the redesign
- `packages/theme/tokens.ts` — primitive scales, `semantic`, `typeRamp`,
  `radius`, `shadows`, `fontFamilies`
- `packages/theme/contrast.ts`, `contrast.test.ts` — WCAG registry, Law 10
  coverage test, same-line white-on-orange scan, doc-staleness test
- `packages/theme/page-tokens.test.ts`, `scheme-scope.test.ts` — type-tag /
  page-motion pins and the light-dark() scope tests
- `packages/theme/package.json` — scripts (`build`, `test`, `typecheck`,
  `lint`)
- `packages/theme/build-css.mjs` — the committed CSS generator (theme.css +
  theme-native.css)
- `packages/theme/contrast-docs.ts` — the generated doc-table writer
- `docs/DESIGN_SYSTEM.md`, `docs/design/CONTRAST.md` — prose + generated
  blocks
- `docs/evidence/pacasa-redesign/platform-defaults.md` — sibling lane's
  evidence format
- Read for contract context only (not edited): `packages/ui/control-look.ts`
  (`variant="cta"` → `tone: 'orange'`), `packages/ui/Button.tsx`,
  `packages/ui/LinkButton.tsx`, `packages/ui/neon/frame-colors.ts`,
  `packages/ui/neon/corner-cut.ts` (`ROUND_RADIUS = 10`, comment mirrors
  `rounded-soft`), `packages/ui/district/tones.ts`,
  `apps/web/app/fonts.ts` + `apps/web/app/Document.tsx` (next/font
  `--font-display`/`--font-sans` variables on `<html>`),
  `apps/mobile/app.config.ts` (expo-font registers both brand fonts),
  `apps/storybook/globals.css` (@font-face for both fonts)

## Skills ledger

| Skill | Path | Loaded |
| --- | --- | --- |
| (none invoked by orchestrator) | — | — |

No orchestrator-provided skill files were attached to this lane. No
healthcare- or design-specific skills were available in this environment;
domain judgement was applied directly from the brief and the in-repo
docs. Argent device tooling is not installed here and none was needed —
this lane changes tokens, not a running UI.

## Changes

### `packages/theme/tokens.ts`

- Header comment now documents the Pa'Casa healthcare remap.
- `semantic` light column remapped (primitive scales untouched):
  - `bg`/`surface`: `concrete-50` → `orange-50` (#FFF7F0 warm daylit paper)
  - `surface-sunken`: `concrete-100` → `orange-100` (#FFEDDB)
  - `surface-raised`: stays `white` (white raised cards)
  - `text`/`text-muted`/`text-secondary`/`text-inverse`: unchanged
    (signage-black / concrete-600 / concrete-700)
  - `primary`: `orange-700` → `royal-700`; `primary-pressed` → `royal-800`
    (no orange as light-mode text)
  - `cta`: `orange-500` → `carolina-500` (dark: `carolina-400`);
    `cta-pressed`: `carolina-600` (dark: `carolina-300`) — calm blue CTA.
    `on-cta` stays `signage-black`/`night`: dark ink holds on the carolina
    face (8.14) AND on the legacy tone-orange face the kit's
    `variant="cta"` still paints via `control-look.ts` (8.02); white would
    fail that face (2.62).
  - `accent`: `royal-500` → `royal-600`; `accent-pressed` → `royal-700`;
    `on-accent` white holds (6.92).
  - `structure`: `royal-500` → `carolina-700`; `border-strong` → `royal-600`.
  - `focus`: `royal-500` → `carolina-700`. First pick `royal-600` measured
    2.94:1 on the night kit controls (`SearchBar`, `SegmentedControl`);
    carolina-700 holds ≥4.16 on every light surface and 4.27 on `ink-950`.
  - `success`, `danger`, `info`, all `tone-*-text`, `glow`, `glow-hot`:
    unchanged (dark values kept for legacy kit surfaces).
  - Dark column unchanged except `cta`/`cta-pressed` (carolina for
    coherence); `primary`/`accent`/etc. keep their night values.
- `fontFamilies.display`: now
  `'Space Grotesk', 'Archivo Black', 'Arial Black', sans-serif` — the calm
  sans leads; Archivo Black remains a loaded fallback. Caveat: `apps/web`
  overrides `--font-display` via next/font (`app/fonts.ts`, outside this
  lane), so web display type stays Archivo Black until that file changes;
  the remap lands on native/storybook, which read the token stack.
- `typeRamp`: `type-body` 17/24 → 18/26; `type-body-strong` 17/24 → 18/26;
  `type-label` 15/20 → 16/22. `type-caption` stays at the 13 pt floor,
  `type-tag` keeps 14/18 @ 0.18 em (test-pinned), `type-station`/`type-title`
  unchanged. Sentence case remains the direction.
- `radius`: `card` 0 → `0.75rem`, `sheet` 0 → `1rem`,
  `soft` `0.625rem` → `0.75rem`. `xs`–`4xl` stay 0 (square neon vocabulary),
  `full` stays a circle. Token names/API unchanged.
- `shadows`: `card`/`raised`/`overlay` changed from coloured neon glows
  (`var(--color-glow)`) to soft neutral elevation (layered `#00041C` at
  4–12% alpha). `glow-orange`/`glow-royal` unchanged for legacy kit
  surfaces; they still read the `glow` tokens, which stay transparent in
  the light scheme.

### `packages/theme/contrast.ts`

- Daylit stand-in backgrounds re-pointed from `concrete-50`/`concrete-100`
  to `orange-50`/`orange-100` in: `daylit:*` rows, grid-tab rows,
  glass-card eyebrow rows, `disabled ghost label on page`,
  `hlynk: body on daylit page`, `cta keyline on daylit page`.
- `daylit: CTA label`/`pressed` now measure `signage-black` on
  `carolina-500`/`carolina-600` (the new `cta`/`cta-pressed` light faces).
- `daylit: link royal-600` rows renamed from `link/focus royal-500`
  (`accent` = royal-600 is the link colour; focus rings are covered by the
  ui-role rows and the token contract).
- `cta button label` now measures the honestly-painted pair `on-cta` on
  `orange-500` (the kit still paints the tone-orange face), with a reason
  noting the carolina token is for screens naming `bg-cta`.
- `FORBIDDEN`: `orange on daylit page` bg → `orange-50` and rule text
  updated (carolina is the daylit CTA now); `orange on light` and
  `carolina on light` rule text updated to name the new roles.
- No threshold weakened; no real text/UI pair re-roled to
  decorative/disabled.

### Generated files

- `packages/theme/theme.css`, `packages/theme/theme-native.css` —
  regenerated by `node build-css.mjs` (`pnpm --filter @acme/theme build`).
- `docs/DESIGN_SYSTEM.md`, `docs/design/CONTRAST.md` — generated tables
  regenerated by `node packages/theme/contrast-docs.ts`; prose updated to
  describe the Pa'Casa direction (semantic diff table, type ramp,
  corners/elevation section, landed-state block).

## Commands and results

- `node packages/theme/build-css.mjs` → "theme.css + theme-native.css
  written" (both committed outputs regenerated).
- `node packages/theme/contrast-docs.ts` → both docs rewritten;
  `node packages/theme/contrast-docs.ts --check` → clean.
- `pnpm --filter @acme/theme test` → 390 tests, **389 pass, 0 fail,
  1 skipped** (`apps/web next build CSS` scope test skips — no
  `apps/web/.next` build newer than theme.css exists).
- `pnpm --filter @acme/theme typecheck` → clean (`tsc --noEmit`).
- `pnpm --filter @acme/theme lint` → clean (eslint).
- Registry summary after remap: 393 measured rows, 369 pass, 0 fail,
  24 exempt — same totals as before; no measurement lost.
- `git checkout pnpm-lock.yaml` — reverted a lockfile rewrite that a
  `pnpm` run applied incidentally (manifests are out of lane).

## Device evidence

NOT VERIFIED on device/simulator/browser. This lane is token-level; no
runtime UI was launched. The `scheme-scope` suite did compile theme.css
through the real Tailwind-postcss + lightningcss pipeline and render both
schemes in headless Chromium — that is build-pipeline verification, not a
device check (AGENTS.md rule honoured).

## Blockers

None for this lane's scope.

## Requests for the parent / other lanes

- `packages/ui/control-look.ts:47` maps `variant="cta"` to `tone: 'orange'`,
  so the kit CTA button still paints an orange face. The semantic `cta`
  token is now `carolina-500`; `on-cta` was kept dark precisely so it stays
  legal on both faces. A UI lane should re-point the cta variant to the
  carolina tone (test `control-look.test.ts:49` asserts the orange mapping).
- `apps/web/app/fonts.ts` binds `--font-display` to the Archivo Black
  next/font variable; for the calm display remap to reach the web app it
  needs to bind the sans (Space Grotesk) variable instead.
- `packages/ui/neon/corner-cut.ts:56` keeps `ROUND_RADIUS = 10` mirroring the
  old `rounded-soft` (0.625rem). It is now 0.75rem/12px; the constant and its
  comment should be updated by the UI lane.
- `apps/web` `.next` build predates the new theme.css; the skipped
  scheme-scope test will exercise the new tokens on the next `web build`.
