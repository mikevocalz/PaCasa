# 07 — Design system: daylit direction, tokens, reuse

Design-system lane (D06) output: how the patient surfaces express "calm,
minimal, daylit healthcare" using the repo's **existing** tokens — no new
visual kit, no hardcoded values.

## Direction

The shared theme already ships a daylit scheme: `packages/theme/tokens.ts`
`semantic.light` (canon "Decision #4: light is daylit and the default") —
concrete neutrals, signage-black type, royal accent, and **glow alpha 00 in
light** (`tokens.ts:174-177`) so neon shadows physically cannot leak into
the daylit scheme. The redesign adopts it; it does not invent a palette.

The patient `src/` surface currently binds its semantic CSS vars to the
**night** values (`src/index.css:8-21`: `--page:#00041C` = ink-950, etc.).
The token contract for the redesign: **same variable names, daylit values.**

## Semantic token mapping (proposal — values must pass `packages/theme/contrast.ts`)

| `src` var (Tailwind name) | Night (current) | Daylit (proposed) | Source token | Approx. contrast |
|---|---|---|---|---|
| `--page` (`bg-page`) | `#00041C` | `#F3F4F4` | `concrete[50]` / `semantic.bg.light` | base |
| `--panel` (`bg-panel`) | `#14182E` | `#FFFFFF` | `signage.white` / `surface-raised.light` | 21:1 vs page ink |
| `--panel-2` (`bg-panel-2`) | `#25293D` | `#EBECED` | `concrete[100]` / `surface-sunken.light` | — |
| `--line` (`border-line`) | `#3C3F51` | `#D2D4D6` | `concrete[200]` / `border.light` | non-text |
| `--fg` (`text-fg`) | `#FBFBFB` | `#1C1E21` | `concrete[900]` ≈ `text.light` | ~16:1 on white |
| `--fg-muted` | `#CED0D1` | `#484C51` | `concrete[700]` ≈ `text-secondary.light` | ~7.6:1 on white |
| `--fg-subtle` | `#90929C` | `#61656A` | `concrete[600]` ≈ `text-muted.light` | ~5.2:1 on page — **minimum for any text** |
| `--accent` (`bg-accent`) | `#0058F8` | `#0058F8` | `royal[500]` / `accent.light` | ~5.6:1 face vs white — white label passes AA |
| `--accent-soft` | `#80ACFC` | `#003FB6` | `royal[700]` ≈ `tone-royal-text.light` | ~8.9:1 — royal-300 fails as daylit text; darken |

Ratios are luminance estimates — **the contrast gate
(`packages/theme/contrast.ts`, `contrast.test.ts`) is the authority**; E13
registers these pairs there before shipping.

Notes:

- `focus` indicator: use `royal[500]` 2 px + 2 px offset on daylit (the
  current `--accent-soft` #80ACFC ring is <3:1 on white → fails WCAG
  2.4.13 intent). Keep the existing `:focus-visible` rule
  (`index.css:39-42`), re-bound to `royal[500]` under the daylit scheme.
- `cta`/orange is **not** the patient action face: in the daylit scheme
  `semantic.cta.light` is brand orange (`tokens.ts:142`) — Pa'Casa keeps
  royal `accent` as the single action color (calmer, matches the src/
  reference UI). Recorded as an intentional divergence; if D06 prefers
  the theme's `cta`, it must be a deliberate token-level decision, not a
  default.

## Radius & shape (soft, not playful)

Current patient chrome is square (bare `border`, no radius classes in
`src/components/patient-ui.jsx`). Proposed radius scale on semantic tokens:

| Token | Value | Applied to |
|---|---|---|
| `radius-sm` | 8 px | inputs, small buttons, chips, toolbar buttons |
| `radius-md` | 12 px | `Panel`, cards, document rows |
| `radius-full` | 999 px | raised center action, mic FAB (already `rounded-full`), status pills |

No nested radius > 4 px difference (panel 12 → inner control 8). No
squircle/glass/neon effects; `shadow-card` is the only elevation, and in
daylit it renders as a soft diffuse shadow — verify it isn't the dark-mode
`rgba(0,4,28,.95)` token on light backgrounds (`tailwind.config.js:52`;
propose `0 8px 24px -12px rgba(28,30,33,.12)` measured by contrast gate).

## Type & copy rules (older adults / bilingual)

- Body on patient surfaces: **18 px** (`text-lg`) baseline, 16 px minimum
  for secondary; current `text-sm` (14 px) provenance/meta copy bumps to
  14→16 where it's content-bearing (form row subtitles) and stays ≥14 for
  pure kickers.
- `font-display` (Space Grotesk) for headings only; `font-body` (Inter) for
  everything else — both already loaded (`index.css:1,9-10`).
- **Sentence case for all interactive labels.** Remove `uppercase` from
  `ActionButton`/`BigAction` (`patient-ui.jsx:42,62`) — uppercase + letter-
  tracking measurably slows older readers. Uppercase stays only on tiny
  provenance kickers ("EN EL FORMULARIO DICE"), where it is a label style,
  not a control.
- No emoji inside labels; lucide/`@acme/ui/icons` only.
- Spanish = primary; English appears only as `sourceLabel` provenance and
  in Traducir's direction labels.

## Component reuse matrix

| Patient need | `src/` reference | Shared-app target | Note |
|---|---|---|---|
| Screen frame (kicker/title/lead) | `PatientFrame` | `ScreenFrame` (`screens/parts.tsx:6-29`) — minus "Spatial systems lab" chrome | remove decorative blobs + "Live workspace" badge |
| Section panel | `Panel` (`patient-ui.jsx:19-29`) | `Panel` (`parts.tsx:31-41`) | daylit tokens; drop `shadow-glow-*` |
| Primary/quiet button | `ActionButton` | `ActionButton` (`parts.tsx:43-72`) or `@acme/ui` Button | sentence case, ≥48 px |
| Large start action | `BigAction` | new semantic "action tile" or Panel+Button composition | keep `disabledHint` contract |
| Progress | `ProgressRow` | `@acme/ui/progress/ProgressBar` | keep `role=progressbar` + text count |
| Overflow menu | `OverflowMenu` (`<details>`) | `Menu`/`BottomSheet` (`packages/ui`) | native: bottom sheet ≥48 px rows |
| Mode switch | `MODES` row (`PaCasaLive.jsx:54-71`) | `SegmentedControl` (`@acme/ui`) | reuse, don't fork |
| Center action / overlay | raised button + `/pacasa` route | `ScanButton` slot → Pa'Casa Live modal via existing `Modal` | keep raised 64 px ≥ `navChrome.raised` |
| Field provenance | kicker + `sourceLabel` | `@acme/ui` `Text` muted + key-value row | English verbatim |
| Edit inline | `input` + Guardar/Cancelar | `TextField` (`@acme/ui`) | visible label required (WCAG 3.3.2) |

**Rules for engineering lanes (E02/D06):** no new primitives without a
variant decision recorded here; no hex in screen code — everything resolves
through `semantic`/`var(--*)`; the `ink-*`/`silver-*` literal classes used in
shared starter screens are the *starter's* night palette and must not be
copied into patient screens.

## Storybook coverage to add (target — none exists for patient UI yet)

`apps/storybook` exists; patient components need stories for: PatientFrame,
Panel, ActionButton (solid/quiet/disabled), BigAction (incl. disabledHint),
ProgressRow (0/n/n), OverflowMenu, answer card (pending/confirmed/
unconfirmed-edited), AnalysisPanel (each AnalysisState), Pa'Casa Live modes
(Hablar empty/listening/proposal; Traducir hit/miss; Preguntar grounded/
miss). Each story in daylit + night scope, RTL spot-check on key screens.
