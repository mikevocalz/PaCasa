# NYC-MON contrast table

Measured 2026-10-04 against `packages/theme/tokens.ts` (the only hex source; `theme.css` and `theme-native.css` are generated from it), re-measured after the Pa'Casa healthcare remap (ADR 0002): the light column is now warm paper (`orange-50`/`orange-100`), the CTA is calm carolina, links/focus are royal/carolina, and `primary` text is royal-700 — no orange in light-mode text or marks. WCAG 2.2 relative luminance with the 0.04045 linearisation threshold. Translucent colours (`/NN`) are composited over the layers beneath them before measuring.

The registry lives in `packages/theme/contrast.ts`; `packages/theme/contrast.test.ts` runs it (`pnpm --filter @acme/theme test`). Every table between `<!-- contrast:... -->` markers is written by `node packages/theme/contrast-docs.ts` from that registry, and the theme tests fail when a table is stale. If the two disagree, the code is right; regenerate rather than editing a number by hand.

## Thresholds

| Role | Minimum | WCAG |
|---|---:|---|
| text | 4.5:1 | 1.4.3, body text under 24px (18.66px bold) |
| large-text | 3:1 | 1.4.3, 24px+, or 18.66px+ bold |
| ui | 3:1 | 1.4.11, control edges, state marks, icons, chart marks |
| decorative | exempt | carries no information; a reason is required |
| disabled | exempt | inactive component; a reason is required |

## Summary

<!-- contrast:summary:start -->

- 393 measured rows: 369 pass, 0 fail, 24 exempt (decorative or disabled).

<!-- contrast:summary:end -->
- Semantic tokens are measured in light and dark. Palette steps (`orange-500`, `ink-950`) do not change with the theme and get one `both` row.
- Every semantic token on every surface passes as a token contract. The 10 failures measured in 5e9ce01 came from how screens combined tokens: opacity modifiers on text and focus rings, a tab bar that used a themed background under hard-coded white, and white labels on the apple face. All 10 are fixed; the findings table below records each one before and after.
- The kit's night facades (cards, fields, nav, tables, charts) pass everywhere. The tone tables in `packages/ui/district/tones.ts` already pick night or white per face by measurement.
- Tone colour as text straight on the page uses the themed `tone-<tone>-text` tokens (`TONE_CLASSES[tone].pageText`), not the night steps in `.text`. Dark keeps the night step; light takes a darker step measured on page, raised, sunken and under the ghost hover tint.

## Daylit findings

The daylit page (62e1772) put three kit classes on `concrete-50` that had only been measured on night. Each was fixed for every caller of the class:

- Field and form errors (`NEON_FIELD.message`: TextField, Textarea, Select, FormField, ErrorMessage, NeonCheckbox; the native VoiceRecorder error) drew `text-apple-400` on the page. They now use `text-danger`, the themed pair, which is `apple-400` inside night scopes. The old "apple tone text on night" row cited this class but measured it on night; the class now has its own row, "field error message on page".
- Ghost Button and ghost IconButton labels, and the CardSlider counter, drew the tone `.text` steps on the page (orange, royal, carolina, leaf, apple, brick). They now draw `pageText`, the new `tone-*-text` tokens; rows "<tone> ghost label on page" and "... on hover tint".
- The native VoiceRecorder hint under its controls drew `text-silver-300` on the page; it now uses `text-text-muted`.

Text and Heading `tone="district"` still draw the night `.text` step by design: they are documented for night faces, and a themed token there would turn dark on an unscoped night facade.

## Findings

The 10 failing rows from 5e9ce01, fixed by class rather than by instance (every occurrence of the failing class was changed, not only the cited line).

| # | Where | Before | Measured before | After | Measured after |
|---|---|---|---:|---|---:|
| 1 | `packages/app/features/schedule/MiniCalendar.tsx:111` | out-of-month day `text-text-muted/50` on `surface-raised` | light 2.29, dark 3.36 | `text-text-muted`. The days stay pressable (`onSelect`), so they are not disabled; the muted colour against `text-text` marks them as outside the month. | 7.15 / 10.08 |
| 2 | `packages/app/features/schedule/BookingSurface.tsx:74` | past day `text-text-muted/50` | light 2.24, dark 3.35 | `text-text-muted`. Past days still call `selectDate`, so they must pass. The day strip sits in the `bg-surface-raised` panel (line 48); the old row measured it on `surface`. | 7.15 / 10.08 |
| 3 | `apps/mobile/components/AppTabBar.tsx:97`, `:109`, `:128` | grid tab idle `text-white/70` on `bg-bg/95` | light 1.04 | Grid bar is a night facade in both themes: `bg-ink-950/95` (rail `bg-ink-950`), idle `text-silver-300`. Measured over a light page, the 95% bar's worst case. | 14.17 (rail 15.36) |
| 4 | `apps/mobile/components/AppTabBar.tsx:84`, `:96`, `:108` | grid tab active `text-primary` on `bg/95 + primary/15` | light 4.29 | `text-orange-400` on `ink-950/95 + orange-500/15`; slab edge `border-orange-500/60` (3.02, ui). | 7.41 |
| 5 | `packages/ui/Button.tsx:23`, `IconButton.tsx:20`, `SearchBar.tsx:26`, `SegmentedControl.web.tsx:16` | focus ring `ring-focus/60` | light 2.68 | `ring-focus`. With `ring-offset-bg` the ring sits on the page colour (5.27 / 7.89); without an offset it sits on the night control face (3.63 / 7.89). | 5.27 / 7.89 |
| 6 | `apps/web/components/site/SiteHeader.tsx` (6 sites), `SiteFooter.tsx:21`, `packages/ui/cards/NeonSwitch.tsx:19`, `NeonCheckbox.tsx:13`, `CardSlider.web.tsx:144` | focus ring `ring-focus/50` | light 2.24, dark 2.66 | `ring-focus` (header on `surface` 5.27 / 7.89, footer on `surface-sunken` 4.74 / 8.02). | 4.74 min |
| 7 | `packages/ui/dropdown.ts:28`, `packages/ui/nav/NavBar.tsx:83` | active item `text-white` on `bg-apple-500` | 4.21 | `text-ink-950`, what `TONE_CLASSES.apple.onFace` uses. | 4.83 |

`ring-offset-2` now always names its band colour. Button, IconButton, NeonSwitch, NeonCheckbox, CardSlider (web) and the primitives story use `ring-offset-bg`, which follows the theme on the page and resolves to night inside `NightScope` / `scheme-dark` faces. PlayerShell (`ring-offset-ink-900`), CircuitButton and the site header profile ring (`ring-offset-surface`) already set one.

## §1.3 rules against the real tokens

The prompt's Knicks numbers were approximations. The repo samples its anchors from the logo: orange `#FC7C00`, royal `#0058F8`, night `#00041C`, banner white `#F8F8F8`. Measured:

| §1.3 approximation | Repo pair | Repo ratio | Verdict |
|---|---|---:|---|
| White on blue ≈ 5.6 | `white` on `royal-500` | 5.60 | body text OK |
| Orange on blue ≈ 2.2 | `orange-500` on `royal-500` | 2.14 | fails text and 3:1 UI |
| Black on orange ≈ 8 | `ink-950` (night) on `orange-500` | 7.76 | button label OK |
| White on orange ≈ 2.6 | `white` on `orange-500` | 2.62 | fails |
| Blue on white ≈ 5.6 | `royal-500` on `ink-50` | 5.27 | OK |

**Is orange on royal used anywhere?** No. A same-line scan of `packages/ui`, `packages/app`, `apps/web/{app,components}` and `apps/mobile/{app,components}` finds no `text-/border-/stroke-/fill-orange-*` next to `bg-royal-*`. The closest case is the chart keyline: `keylineFor()` (`packages/ui/district/series.ts:75`) draws a royal keyline under orange strokes (`NeonLineChart.tsx:129`). The stroke sits on night (7.76), and the keyline is registered as decorative.

**White on orange buttons anywhere?** No. The scan finds no `text-white`/`text-ink-50` beside `bg-orange-500` or `bg-primary`. Orange faces take night text: `TONE_CLASSES.orange.onFace` (`tones.ts:117`), `dropdown.ts:19`, `NavBar.tsx:69`, and `on-primary` resolves to night in dark mode. In light mode `primary` is `royal-700` and `on-primary` is white: 8.80 — orange has left light-mode text and faces entirely.

**Orange is an accent on night and neutrals.** Orange as text on night uses `orange-400` (9.74) or `orange-500` (7.76). Orange on the warm light page measures 2.41 and fails even 3:1, so daylit is orange-free for text and marks: `primary` is `royal-700`, the CTA face is `cta` (`carolina-500`), and links/focus use `accent` (`royal-600`) and `focus` (`carolina-700`). The same holds for carolina (2.42 as text) and leaf (2.70); light mode uses `info` (`carolina-800`) and `success` (`leaf-700`). The kit's `variant="cta"` still paints its legacy tone-orange face (`control-look.ts:47`), and `on-cta` is dark ink so it holds on both that face (8.02) and the carolina token (8.14).

**Royal is structure, not text, on night.** `royal-500` on night is 3.63: fine for borders and chart marks, short of 4.5 for text. Royal labels use `royal-300` (8.92).

The test keeps these honest: each forbidden pair below must still measure under its threshold (otherwise the rule is stale), and the same-line scan fails the build if a white-on-orange or orange-on-royal class pair appears in component code. The scan is a heuristic. It reads tone tables and `tv()` slot maps, where a face and its label share a line, and misses classes composed across lines.

## Measured table
### Usage

<!-- contrast:usage:start -->

| Pair | Mode | Foreground | Background | Ratio | Role (min) | Result | Where used |
|---|---|---|---|---:|---|---|---|
| text on surface | light | `text` #000000 | `surface` #FFF7F0 | 19.81 | text (4.5) | pass | `packages/ui/Text.tsx:39`, `packages/ui/Heading.tsx:25` |
| text on surface | dark | `text` #F8F8F8 | `surface` #00041C | 19.12 | text (4.5) | pass | `packages/ui/Text.tsx:39`, `packages/ui/Heading.tsx:25` |
| muted text on surface | light | `text-muted` #61656A | `surface` #FFF7F0 | 5.54 | text (4.5) | pass | `packages/ui/Text.tsx:40` |
| muted text on surface | dark | `text-muted` #BEC0C2 | `surface` #00041C | 11.13 | text (4.5) | pass | `packages/ui/Text.tsx:40` |
| muted text on raised | light | `text-muted` #61656A | `surface-raised` #FFFFFF | 5.87 | text (4.5) | pass | `packages/ui/Text.tsx:40` |
| muted text on raised | dark | `text-muted` #BEC0C2 | `surface-raised` #0A1230 | 10.08 | text (4.5) | pass | `packages/ui/Text.tsx:40` |
| primary text on surface | light | `primary` #003FB6 | `surface` #FFF7F0 | 8.30 | large-text (3) | pass | token contract; font-display text-display-xl (60px) |
| primary text on surface | dark | `primary` #FC7C00 | `surface` #00041C | 7.76 | large-text (3) | pass | token contract; font-display text-display-xl (60px) |
| primary text on raised | light | `primary` #003FB6 | `surface-raised` #FFFFFF | 8.80 | text (4.5) | pass | `packages/ui/Text.tsx:42`, `packages/ui/Heading.tsx:27` |
| primary text on raised | dark | `primary` #FC7C00 | `surface-raised` #0A1230 | 7.02 | text (4.5) | pass | `packages/ui/Text.tsx:42`, `packages/ui/Heading.tsx:27` |
| primary icon in primary/10 well | light | `primary` #003FB6 | `surface-raised + primary/10` #E6ECF8 | 7.41 | ui (3) | pass | token contract |
| primary icon in primary/10 well | dark | `primary` #FC7C00 | `surface-raised + primary/10` #221D2B | 6.29 | ui (3) | pass | token contract |
| accent text on raised | light | `accent` #004CD9 | `surface-raised` #FFFFFF | 6.92 | text (4.5) | pass | `packages/ui/Text.tsx:41` |
| accent text on raised | dark | `accent` #4BA8F0 | `surface-raised` #0A1230 | 7.14 | text (4.5) | pass | `packages/ui/Text.tsx:41` |
| accent icon in accent/10 well | light | `accent` #004CD9 | `surface-raised + accent/10` #E6EDFB | 5.89 | ui (3) | pass | token contract |
| accent icon in accent/10 well | dark | `accent` #4BA8F0 | `surface-raised + accent/10` #112143 | 6.17 | ui (3) | pass | token contract |
| accent bell icon on raised | light | `accent` #004CD9 | `surface-raised` #FFFFFF | 6.92 | ui (3) | pass | token contract |
| accent bell icon on raised | dark | `accent` #4BA8F0 | `surface-raised` #0A1230 | 7.14 | ui (3) | pass | token contract |
| danger text on raised | light | `danger` #D50000 | `surface-raised` #FFFFFF | 5.48 | text (4.5) | pass | `packages/ui/Text.tsx:44` |
| danger text on raised | dark | `danger` #FA4040 | `surface-raised` #0A1230 | 5.14 | text (4.5) | pass | `packages/ui/Text.tsx:44` |
| danger text on danger/10 hover | light | `danger` #D50000 | `surface-raised + danger/10` #FBE6E6 | 4.57 | text (4.5) | pass | token contract |
| danger text on danger/10 hover | dark | `danger` #FA4040 | `surface-raised + danger/10` #221732 | 4.76 | text (4.5) | pass | token contract |
| on-primary on primary | light | `on-primary` #FFFFFF | `primary` #003FB6 | 8.80 | text (4.5) | pass | token contract |
| on-primary on primary | dark | `on-primary` #00041C | `primary` #FC7C00 | 7.76 | text (4.5) | pass | token contract |
| on-primary/90 on primary | light | `on-primary/90` #E6ECF8 | `primary` #003FB6 | 7.41 | text (4.5) | pass | token contract |
| on-primary/90 on primary | dark | `on-primary/90` #191019 | `primary` #FC7C00 | 7.10 | text (4.5) | pass | token contract |
| on-primary on primary-pressed | light | `on-primary` #FFFFFF | `primary-pressed` #003193 | 11.29 | text (4.5) | pass | token contract |
| on-primary on primary-pressed | dark | `on-primary` #00041C | `primary-pressed` #FD9D40 | 9.74 | text (4.5) | pass | token contract |
| on-accent on accent | light | `on-accent` #FFFFFF | `accent` #004CD9 | 6.92 | text (4.5) | pass | token contract |
| on-accent on accent | dark | `on-accent` #00041C | `accent` #4BA8F0 | 7.89 | text (4.5) | pass | token contract |
| inverse text on text | light | `text-inverse` #F8F8F8 | `text` #000000 | 19.77 | text (4.5) | pass | `packages/ui/Text.tsx:43`, `packages/ui/Heading.tsx:29` |
| inverse text on text | dark | `text-inverse` #00041C | `text` #F8F8F8 | 19.12 | text (4.5) | pass | `packages/ui/Text.tsx:43`, `packages/ui/Heading.tsx:29` |
| out-of-month day | light | `text-muted` #61656A | `surface-raised` #FFFFFF | 5.87 | text (4.5) | pass | token contract; days stay readable and pressable (onSelect); muted colour, not opacity, marks them as outside the month |
| out-of-month day | dark | `text-muted` #BEC0C2 | `surface-raised` #0A1230 | 10.08 | text (4.5) | pass | token contract; days stay readable and pressable (onSelect); muted colour, not opacity, marks them as outside the month |
| past day | light | `text-muted` #61656A | `surface-raised` #FFFFFF | 5.87 | text (4.5) | pass | token contract; past days still call selectDate (BookingSurface.tsx:58); the day strip sits in the bg-surface-raised panel (BookingSurface.tsx:48) |
| past day | dark | `text-muted` #BEC0C2 | `surface-raised` #0A1230 | 10.08 | text (4.5) | pass | token contract; past days still call selectDate (BookingSurface.tsx:58); the day strip sits in the bg-surface-raised panel (BookingSurface.tsx:48) |
| grid tab label idle | both | `silver-300` #DFE0E1 | `orange-50 + ink-950/95` #0D1027 | 14.18 | text (4.5) | pass | token contract; bar is bg-ink-950/95 in both themes; measured over the light page |
| grid tab label active | both | `orange-400` #FD9D40 | `orange-50 + ink-950/95 + orange-500/15` #312021 | 7.40 | text (4.5) | pass | token contract |
| grid tab selected edge | both | `orange-500/60` #AB570D | `orange-50 + ink-950/95 + orange-500/15` #312021 | 3.02 | ui (3) | pass | token contract |
| grid rail label idle | both | `silver-300` #DFE0E1 | `ink-950` #00041C | 15.36 | text (4.5) | pass | token contract |
| focus ring on offset band | light | `focus` #3577B0 | `bg` #FFF7F0 | 4.49 | ui (3) | pass | `packages/ui/Button.tsx:23`, `packages/ui/IconButton.tsx:20`, `packages/ui/cards/NeonSwitch.tsx:19`, `packages/ui/cards/NeonCheckbox.tsx:13`, `packages/ui/cards/CardSlider.web.tsx:144`; ring-offset-2 ring-offset-bg paints the page colour between the control and the ring |
| focus ring on offset band | dark | `focus` #4BA8F0 | `bg` #00041C | 7.89 | ui (3) | pass | `packages/ui/Button.tsx:23`, `packages/ui/IconButton.tsx:20`, `packages/ui/cards/NeonSwitch.tsx:19`, `packages/ui/cards/NeonCheckbox.tsx:13`, `packages/ui/cards/CardSlider.web.tsx:144`; ring-offset-2 ring-offset-bg paints the page colour between the control and the ring |
| focus ring on night control | light | `focus` #3577B0 | `ink-950` #00041C | 4.27 | ui (3) | pass | `packages/ui/SearchBar.tsx:26`, `packages/ui/SegmentedControl.web.tsx:16`; no offset: the ring touches the night control face |
| focus ring on night control | dark | `focus` #4BA8F0 | `ink-950` #00041C | 7.89 | ui (3) | pass | `packages/ui/SearchBar.tsx:26`, `packages/ui/SegmentedControl.web.tsx:16`; no offset: the ring touches the night control face |
| focus ring on page | light | `focus` #3577B0 | `bg` #FFF7F0 | 4.49 | ui (3) | pass | `packages/ui/dropdown.ts:15` |
| focus ring on page | dark | `focus` #4BA8F0 | `bg` #00041C | 7.89 | ui (3) | pass | `packages/ui/dropdown.ts:15` |
| profile ring active | both | `orange-500` #FC7C00 | `ink-950` #00041C | 7.76 | ui (3) | pass | token contract; ring-offset-ink-950 puts the night bar between the avatar and the ring |
| profile ring hover | both | `silver-400` #CED0D1 | `ink-950` #00041C | 13.12 | ui (3) | pass | token contract |
| unread dot | light | `danger` #D50000 | `surface-raised` #FFFFFF | 5.48 | ui (3) | pass | token contract |
| unread dot | dark | `danger` #FA4040 | `surface-raised` #0A1230 | 5.14 | ui (3) | pass | token contract |
| theme border | light | `border` #D2D4D6 | `surface-raised` #FFFFFF | 1.49 | decorative (0) | exempt | `packages/ui/Card.tsx:159`; frame on controls whose text label or icon identifies them; separators |
| theme border | dark | `border` #1A2E6E | `surface-raised` #0A1230 | 1.45 | decorative (0) | exempt | `packages/ui/Card.tsx:159`; frame on controls whose text label or icon identifies them; separators |
| neon glow | light | `glow` #FFF7F0 | `bg` #FFF7F0 | 1.00 | decorative (0) | exempt | `packages/theme/tokens.ts:340`, `packages/ui/district/tones.ts:132`; box-shadow halo behind a surface that already has its own edge; fully transparent on daylit (no glow in daylight) |
| neon glow | dark | `glow` #003BAB | `bg` #00041C | 2.14 | decorative (0) | exempt | `packages/theme/tokens.ts:340`, `packages/ui/district/tones.ts:132`; box-shadow halo behind a surface that already has its own edge; fully transparent on daylit (no glow in daylight) |
| hot glow | light | `glow-hot` #FFF7F0 | `bg` #FFF7F0 | 1.00 | decorative (0) | exempt | `packages/theme/tokens.ts:343`; box-shadow halo behind a surface that already has its own edge; fully transparent on daylit (no glow in daylight) |
| hot glow | dark | `glow-hot` #7E400E | `bg` #00041C | 2.55 | decorative (0) | exempt | `packages/theme/tokens.ts:343`; box-shadow halo behind a surface that already has its own edge; fully transparent on daylit (no glow in daylight) |
| structure rule /40 | light | `structure/40` #AEC4D6 | `bg` #FFF7F0 | 1.70 | decorative (0) | exempt | `packages/spatial/rive/RiveStage.native.tsx:19`; frame around the Rive stage; no information |
| structure rule /40 | dark | `structure/40` #002674 | `bg` #00041C | 1.47 | decorative (0) | exempt | `packages/spatial/rive/RiveStage.native.tsx:19`; frame around the Rive stage; no information |
| orange ghost label on page | light | `tone-orange-text` #884300 | `bg` #FFF7F0 | 6.95 | text (4.5) | pass | `packages/ui/district/tones.ts:123`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/cards/CardSlider.shared.tsx:33` |
| orange ghost label on page | dark | `tone-orange-text` #FD9D40 | `bg` #00041C | 9.74 | text (4.5) | pass | `packages/ui/district/tones.ts:123`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/cards/CardSlider.shared.tsx:33` |
| orange ghost label on hover tint | light | `tone-orange-text` #884300 | `surface-sunken + orange-500/15` #FFDCBA | 5.68 | text (4.5) | pass | `packages/ui/district/tones.ts:123`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/Button.tsx:132`; tint layer fades in on group-hover; measured on the sunken page surface |
| orange ghost label on hover tint | dark | `tone-orange-text` #FD9D40 | `surface-sunken + orange-500/15` #26140F | 8.46 | text (4.5) | pass | `packages/ui/district/tones.ts:123`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/Button.tsx:132`; tint layer fades in on group-hover; measured on the sunken page surface |
| royal ghost label on page | light | `tone-royal-text` #004CD9 | `bg` #FFF7F0 | 6.53 | text (4.5) | pass | `packages/ui/district/tones.ts:131`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/cards/CardSlider.shared.tsx:33` |
| royal ghost label on page | dark | `tone-royal-text` #80ACFC | `bg` #00041C | 8.92 | text (4.5) | pass | `packages/ui/district/tones.ts:131`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/cards/CardSlider.shared.tsx:33` |
| royal ghost label on hover tint | light | `tone-royal-text` #004CD9 | `surface-sunken + royal-500/15` #D9D7DF | 4.84 | text (4.5) | pass | `packages/ui/district/tones.ts:131`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/Button.tsx:132`; tint layer fades in on group-hover; measured on the sunken page surface |
| royal ghost label on hover tint | dark | `tone-royal-text` #80ACFC | `surface-sunken + royal-500/15` #000F35 | 8.25 | text (4.5) | pass | `packages/ui/district/tones.ts:131`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/Button.tsx:132`; tint layer fades in on group-hover; measured on the sunken page surface |
| carolina ghost label on page | light | `tone-carolina-text` #295D8E | `bg` #FFF7F0 | 6.50 | text (4.5) | pass | `packages/ui/district/tones.ts:138`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/cards/CardSlider.shared.tsx:33` |
| carolina ghost label on page | dark | `tone-carolina-text` #78BEF4 | `bg` #00041C | 10.12 | text (4.5) | pass | `packages/ui/district/tones.ts:138`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/cards/CardSlider.shared.tsx:33` |
| carolina ghost label on hover tint | light | `tone-carolina-text` #295D8E | `surface-sunken + carolina-500/15` #E4E3DE | 5.34 | text (4.5) | pass | `packages/ui/district/tones.ts:138`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/Button.tsx:132`; tint layer fades in on group-hover; measured on the sunken page surface |
| carolina ghost label on hover tint | dark | `tone-carolina-text` #78BEF4 | `surface-sunken + carolina-500/15` #0B1B33 | 8.59 | text (4.5) | pass | `packages/ui/district/tones.ts:138`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/Button.tsx:132`; tint layer fades in on group-hover; measured on the sunken page surface |
| leaf ghost label on page | light | `tone-leaf-text` #225E1F | `bg` #FFF7F0 | 7.37 | text (4.5) | pass | `packages/ui/district/tones.ts:145`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/cards/CardSlider.shared.tsx:33` |
| leaf ghost label on page | dark | `tone-leaf-text` #6FC26B | `bg` #00041C | 9.29 | text (4.5) | pass | `packages/ui/district/tones.ts:145`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/cards/CardSlider.shared.tsx:33` |
| leaf ghost label on hover tint | light | `tone-leaf-text` #225E1F | `surface-sunken + leaf-500/15` #E2E4C3 | 5.98 | text (4.5) | pass | `packages/ui/district/tones.ts:145`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/Button.tsx:132`; tint layer fades in on group-hover; measured on the sunken page surface |
| leaf ghost label on hover tint | dark | `tone-leaf-text` #6FC26B | `surface-sunken + leaf-500/15` #091C18 | 8.07 | text (4.5) | pass | `packages/ui/district/tones.ts:145`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/Button.tsx:132`; tint layer fades in on group-hover; measured on the sunken page surface |
| apple ghost label on page | light | `tone-apple-text` #AE0000 | `bg` #FFF7F0 | 7.08 | text (4.5) | pass | `packages/ui/district/tones.ts:153`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/cards/CardSlider.shared.tsx:33` |
| apple ghost label on page | dark | `tone-apple-text` #FA4040 | `bg` #00041C | 5.68 | text (4.5) | pass | `packages/ui/district/tones.ts:153`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/cards/CardSlider.shared.tsx:33` |
| apple ghost label on hover tint | light | `tone-apple-text` #AE0000 | `surface-sunken + apple-500/15` #FEC9BA | 5.11 | text (4.5) | pass | `packages/ui/district/tones.ts:153`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/Button.tsx:132`; tint layer fades in on group-hover; measured on the sunken page surface |
| apple ghost label on hover tint | dark | `tone-apple-text` #FA4040 | `surface-sunken + apple-500/15` #25020F | 5.37 | text (4.5) | pass | `packages/ui/district/tones.ts:153`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/Button.tsx:132`; tint layer fades in on group-hover; measured on the sunken page surface |
| brick ghost label on page | light | `tone-brick-text` #602F00 | `bg` #FFF7F0 | 10.41 | text (4.5) | pass | `packages/ui/district/tones.ts:160`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/cards/CardSlider.shared.tsx:33` |
| brick ghost label on page | dark | `tone-brick-text` #FEBE80 | `bg` #00041C | 12.47 | text (4.5) | pass | `packages/ui/district/tones.ts:160`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/cards/CardSlider.shared.tsx:33` |
| brick ghost label on hover tint | light | `tone-brick-text` #602F00 | `surface-sunken + orange-800/25` #E1C3A4 | 6.57 | text (4.5) | pass | `packages/ui/district/tones.ts:160`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/Button.tsx:132`; tint layer fades in on group-hover; measured on the sunken page surface |
| brick ghost label on hover tint | dark | `tone-brick-text` #FEBE80 | `surface-sunken + orange-800/25` #22120E | 11.09 | text (4.5) | pass | `packages/ui/district/tones.ts:160`, `packages/ui/Button.tsx:73`, `packages/ui/IconButton.tsx:79`, `packages/ui/Button.tsx:132`; tint layer fades in on group-hover; measured on the sunken page surface |
| disabled ghost label on page | both | `ink-400` #90929C | `orange-50` #FFF7F0 | 2.92 | disabled (0) | exempt | `packages/ui/Button.tsx:48`, `packages/ui/IconButton.tsx:79`; inactive control: aria-disabled, no press handler |
| field error message on page | light | `danger` #D50000 | `bg` #FFF7F0 | 5.17 | text (4.5) | pass | `packages/ui/cards/neon-field.ts:22`, `packages/ui/ErrorMessage.tsx:21`, `packages/ui/cards/NeonCheckbox.tsx:80`, `packages/ui/audio/VoiceRecorder.native.tsx:288` |
| field error message on page | dark | `danger` #FA4040 | `bg` #00041C | 5.68 | text (4.5) | pass | `packages/ui/cards/neon-field.ts:22`, `packages/ui/ErrorMessage.tsx:21`, `packages/ui/cards/NeonCheckbox.tsx:80`, `packages/ui/audio/VoiceRecorder.native.tsx:288` |
| daylit field edge on page | light | `text-muted` #61656A | `bg` #FFF7F0 | 5.54 | ui (3) | pass | `packages/ui/TextField.tsx:41`; the 2px edge is the field boundary (SC 1.4.11) |
| daylit field edge on page | dark | `text-muted` #BEC0C2 | `bg` #00041C | 11.13 | ui (3) | pass | `packages/ui/TextField.tsx:41`; the 2px edge is the field boundary (SC 1.4.11) |
| daylit field edge on sunken | light | `text-muted` #61656A | `surface-sunken` #FFEDDB | 5.14 | ui (3) | pass | `packages/ui/TextField.tsx:41` |
| daylit field edge on sunken | dark | `text-muted` #BEC0C2 | `surface-sunken` #000212 | 11.31 | ui (3) | pass | `packages/ui/TextField.tsx:41` |
| daylit field text | light | `text` #000000 | `surface-raised` #FFFFFF | 21.00 | text (4.5) | pass | `packages/ui/TextField.tsx:41` |
| daylit field text | dark | `text` #F8F8F8 | `surface-raised` #0A1230 | 17.31 | text (4.5) | pass | `packages/ui/TextField.tsx:41` |
| daylit field placeholder | light | `text-muted` #61656A | `surface-raised` #FFFFFF | 5.87 | text (4.5) | pass | `packages/ui/TextField.tsx:42` |
| daylit field placeholder | dark | `text-muted` #BEC0C2 | `surface-raised` #0A1230 | 10.08 | text (4.5) | pass | `packages/ui/TextField.tsx:42` |
| daylit field label | light | `text` #000000 | `bg` #FFF7F0 | 19.81 | text (4.5) | pass | `packages/ui/TextField.tsx:39` |
| daylit field label | dark | `text` #F8F8F8 | `bg` #00041C | 19.12 | text (4.5) | pass | `packages/ui/TextField.tsx:39` |
| daylit field error edge | light | `danger` #D50000 | `bg` #FFF7F0 | 5.17 | ui (3) | pass | `packages/ui/TextField.tsx:46` |
| daylit field error edge | dark | `danger` #FA4040 | `bg` #00041C | 5.68 | ui (3) | pass | `packages/ui/TextField.tsx:46` |
| daylit field focus edge | light | `focus` #3577B0 | `bg` #FFF7F0 | 4.49 | ui (3) | pass | `packages/ui/TextField.tsx:42` |
| daylit field focus edge | dark | `focus` #4BA8F0 | `bg` #00041C | 7.89 | ui (3) | pass | `packages/ui/TextField.tsx:42` |
| field clear glyph (daylit) | light | `text-muted` #61656A | `surface-raised` #FFFFFF | 5.87 | ui (3) | pass | `packages/ui/TextField.tsx:118` |
| field clear glyph (daylit) | dark | `text-muted` #BEC0C2 | `surface-raised` #0A1230 | 10.08 | ui (3) | pass | `packages/ui/TextField.tsx:118` |
| field clear glyph (well) | both | `silver-300` #DFE0E1 | `ink-950` #00041C | 15.36 | ui (3) | pass | `packages/ui/TextField.tsx:118` |
| system sheet title | light | `text` #000000 | `surface-raised` #FFFFFF | 21.00 | text (4.5) | pass | `packages/ui/BottomSheet.tsx:49` |
| system sheet title | dark | `text` #F8F8F8 | `surface-raised` #0A1230 | 17.31 | text (4.5) | pass | `packages/ui/BottomSheet.tsx:49` |
| system sheet close edge | light | `border-strong` #004CD9 | `surface-raised` #FFFFFF | 6.92 | ui (3) | pass | `packages/ui/BottomSheet.tsx:50` |
| system sheet close edge | dark | `border-strong` #4082FA | `surface-raised` #0A1230 | 5.07 | ui (3) | pass | `packages/ui/BottomSheet.tsx:50` |
| system sheet close glyph | light | `text` #000000 | `surface-raised` #FFFFFF | 21.00 | ui (3) | pass | `packages/ui/BottomSheet.tsx:51` |
| system sheet close glyph | dark | `text` #F8F8F8 | `surface-raised` #0A1230 | 17.31 | ui (3) | pass | `packages/ui/BottomSheet.tsx:51` |
| cta button label | light | `on-cta` #000000 | `orange-500` #FC7C00 | 8.02 | text (4.5) | pass | `packages/ui/Button.tsx:117`, `packages/ui/control-look.ts:47`; variant="cta" paints the legacy tone-orange face; on-cta also holds on the carolina cta token (8.14 light / 10+ dark) |
| cta button label | dark | `on-cta` #00041C | `orange-500` #FC7C00 | 7.76 | text (4.5) | pass | `packages/ui/Button.tsx:117`, `packages/ui/control-look.ts:47`; variant="cta" paints the legacy tone-orange face; on-cta also holds on the carolina cta token (8.14 light / 10+ dark) |
| cta keyline on daylit page | both | `orange-950` #3C1E00 | `orange-50` #FFF7F0 | 14.38 | ui (3) | pass | `packages/ui/neon/frame-colors.ts:10`; the orange face is 2.41:1 on the warm page, so the night keyline is the boundary by day |
| cta face on night page | both | `orange-500` #FC7C00 | `ink-950` #00041C | 7.76 | ui (3) | pass | `packages/ui/neon/frame-colors.ts:10`; after dark the face itself is the boundary; its orange-950 keyline is not |
| neutral badge label | light | `text-secondary` #484C51 | `surface-sunken` #FFEDDB | 7.57 | text (4.5) | pass | `packages/ui/Badge.tsx:100` |
| neutral badge label | dark | `text-secondary` #BEC0C2 | `surface-sunken` #000212 | 11.31 | text (4.5) | pass | `packages/ui/Badge.tsx:100` |
| neutral badge edge | light | `border` #D2D4D6 | `bg` #FFF7F0 | 1.40 | decorative (0) | exempt | `packages/ui/Badge.tsx:98`; status chip, not a control; its text identifies it |
| neutral badge edge | dark | `border` #1A2E6E | `bg` #00041C | 1.61 | decorative (0) | exempt | `packages/ui/Badge.tsx:98`; status chip, not a control; its text identifies it |
| title on night | both | `ink-50` #F8F8F8 | `ink-950` #00041C | 19.12 | text (4.5) | pass | `packages/ui/Card.tsx:48`, `packages/ui/cards/neon-field.ts:15`, `packages/ui/ToastCard.tsx:37` |
| white on night | both | `white` #FFFFFF | `ink-950` #00041C | 20.31 | text (4.5) | pass | `packages/ui/charts/StatCard.tsx:54` |
| table cell on stripe | both | `silver-100` #F6F6F6 | `ink-900` #14182E | 16.20 | text (4.5) | pass | `packages/ui/DataTable.tsx:44`, `packages/ui/DataTable.tsx:53` |
| nav link on night | both | `silver-200` #ECECED | `ink-950` #00041C | 17.20 | text (4.5) | pass | `packages/ui/dropdown.ts:16` |
| nav link on hover | both | `silver-200` #ECECED | `ink-800` #25293D | 12.16 | text (4.5) | pass | `packages/ui/dropdown.ts:14` |
| body on night | both | `silver-300` #DFE0E1 | `ink-950` #00041C | 15.36 | text (4.5) | pass | `packages/ui/Card.tsx:48`, `packages/ui/Dialog.tsx:49`, `packages/ui/TabBar.tsx:36` |
| table head on ink-900 | both | `silver-300` #DFE0E1 | `ink-900` #14182E | 13.24 | text (4.5) | pass | `packages/ui/DataTable.tsx:35`, `packages/ui/DataTable.tsx:38` |
| caption on night | both | `silver-400` #CED0D1 | `ink-950` #00041C | 13.12 | text (4.5) | pass | `packages/ui/DataTable.tsx:47`, `packages/ui/charts/StatCard.tsx:57` |
| pager text on ink-900 | both | `silver-400` #CED0D1 | `ink-900` #14182E | 11.31 | text (4.5) | pass | `packages/ui/DataTable.tsx:51` |
| axis tick on night | both | `silver-500` #BEC0C2 | `ink-950` #00041C | 11.13 | text (4.5) | pass | `packages/ui/charts/NeonBarChart.tsx:64`, `packages/ui/charts/NeonLineChart.tsx:78` |
| placeholder on field well | both | `silver-500` #BEC0C2 | `ink-950` #00041C | 11.13 | text (4.5) | pass | `packages/ui/cards/neon-field.ts:16` |
| orange tone text on night | both | `orange-400` #FD9D40 | `ink-950` #00041C | 9.74 | text (4.5) | pass | `packages/ui/district/tones.ts:123` |
| royal tone text on night | both | `royal-300` #80ACFC | `ink-950` #00041C | 8.92 | text (4.5) | pass | `packages/ui/district/tones.ts:131` |
| carolina tone text on night | both | `carolina-400` #78BEF4 | `ink-950` #00041C | 10.12 | text (4.5) | pass | `packages/ui/district/tones.ts:138` |
| leaf tone text on night | both | `leaf-400` #6FC26B | `ink-950` #00041C | 9.29 | text (4.5) | pass | `packages/ui/district/tones.ts:145`, `packages/ui/charts/StatCard.tsx:72` |
| apple tone text on night | both | `apple-400` #FA4040 | `ink-950` #00041C | 5.68 | text (4.5) | pass | `packages/ui/district/tones.ts:153`, `packages/ui/Menu.web.tsx:63`, `packages/ui/audio/PlayerShell.tsx:34` |
| brick tone text on night | both | `orange-300` #FEBE80 | `ink-950` #00041C | 12.47 | text (4.5) | pass | `packages/ui/district/tones.ts:160` |
| sort glyph carolina-300 | both | `carolina-300` #A5D4F8 | `ink-900` #14182E | 11.15 | ui (3) | pass | `packages/ui/DataTable.tsx:59` |
| sort glyph leaf-300 | both | `leaf-300` #9FD79D | `ink-900` #14182E | 10.57 | ui (3) | pass | `packages/ui/DataTable.tsx:60` |
| sort glyph apple-300 | both | `apple-300` #FC8080 | `ink-900` #14182E | 7.12 | ui (3) | pass | `packages/ui/DataTable.tsx:62` |
| card themed heading on night face | both | `ink-50` #F8F8F8 | `ink-950` #00041C | 19.12 | text (4.5) | pass | `packages/theme/theme.css:328`; text-text inside a cornerCut or beam Card resolves to ink-50 on the face |
| card themed muted on night face | both | `silver-500` #BEC0C2 | `ink-950` #00041C | 11.13 | text (4.5) | pass | `packages/theme/theme.css:329`, `packages/theme/theme.css:330`; text-muted and text-secondary inside the Card face resolve to silver-500 |
| card themed primary on night face | both | `orange-500` #FC7C00 | `ink-950` #00041C | 7.76 | text (4.5) | pass | `packages/theme/theme.css:332` |
| card themed accent on night face | both | `carolina-500` #4BA8F0 | `ink-950` #00041C | 7.89 | text (4.5) | pass | `packages/theme/theme.css:338`, `packages/theme/theme.css:349`; accent and info share carolina-500 on the face |
| card themed success on night face | both | `leaf-500` #3FAE3A | `ink-950` #00041C | 7.09 | text (4.5) | pass | `packages/theme/theme.css:345` |
| card themed danger on night face | both | `apple-400` #FA4040 | `ink-950` #00041C | 5.68 | text (4.5) | pass | `packages/theme/theme.css:347` |
| card themed text on orange notch | both | `ink-950` #00041C | `orange-500` #FC7C00 | 7.76 | text (4.5) | pass | `packages/ui/Card.tsx:34` |
| card themed text on carolina notch | both | `ink-950` #00041C | `carolina-500` #4BA8F0 | 7.89 | text (4.5) | pass | `packages/ui/Card.tsx:34` |
| card themed text on leaf notch | both | `ink-950` #00041C | `leaf-500` #3FAE3A | 7.09 | text (4.5) | pass | `packages/ui/Card.tsx:34` |
| card themed text on apple notch | both | `ink-950` #00041C | `apple-500` #F80000 | 4.83 | text (4.5) | pass | `packages/ui/Card.tsx:34` |
| card themed text on white notch | both | `ink-950` #00041C | `ink-50` #F8F8F8 | 19.12 | text (4.5) | pass | `packages/ui/Card.tsx:34` |
| card themed text on royal notch | both | `white` #FFFFFF | `royal-500` #0058F8 | 5.60 | text (4.5) | pass | `packages/ui/Card.tsx:36` |
| card themed text on brick notch | both | `white` #FFFFFF | `orange-800` #884300 | 7.37 | text (4.5) | pass | `packages/ui/Card.tsx:36` |
| home headline on ink panel | both | `orange-500` #FC7C00 | `ink-800` #25293D | 5.48 | large-text (3) | pass | `packages/ui/neon/SolidPanel.tsx:42`; Heading display-sm (30px web, 26px native at rem 14) on the SolidPanel tone="ink" face, which is night in both themes |
| orange eyebrow on glass card | both | `orange-500` #FC7C00 | `orange-50 + ink-950/85` #26283C | 5.50 | text (4.5) | pass | `packages/ui/future/GridCard.tsx:29`, `packages/ui/future/CircuitButton.tsx:49`; measured over the light page, the worst case for the 85% night glass |
| carolina eyebrow on glass card | both | `carolina-500` #4BA8F0 | `orange-50 + ink-950/85` #26283C | 5.60 | text (4.5) | pass | `packages/ui/future/GridCard.tsx:30`, `packages/ui/future/CircuitButton.tsx:50`; measured over the light page, the worst case for the 85% night glass |
| night on orange face | both | `ink-950` #00041C | `orange-500` #FC7C00 | 7.76 | text (4.5) | pass | `packages/ui/district/tones.ts:123`, `packages/ui/dropdown.ts:19` |
| white on royal face | both | `white` #FFFFFF | `royal-500` #0058F8 | 5.60 | text (4.5) | pass | `packages/ui/district/tones.ts:131`, `packages/ui/dropdown.ts:25`, `packages/ui/DataTable.tsx:58` |
| banner white on royal face | both | `ink-50` #F8F8F8 | `royal-500` #0058F8 | 5.27 | text (4.5) | pass | `packages/ui/district/tones.ts:131`, `packages/ui/future/CircuitButton.tsx:48` |
| night on carolina face | both | `ink-950` #00041C | `carolina-500` #4BA8F0 | 7.89 | text (4.5) | pass | `packages/ui/district/tones.ts:138`, `packages/ui/future/CircuitButton.tsx:47` |
| night on leaf face | both | `ink-950` #00041C | `leaf-500` #3FAE3A | 7.09 | text (4.5) | pass | `packages/ui/district/tones.ts:145` |
| night on apple face | both | `ink-950` #00041C | `apple-500` #F80000 | 4.83 | text (4.5) | pass | `packages/ui/district/tones.ts:153`, `packages/ui/Badge.tsx:113`, `packages/ui/dropdown.ts:28` |
| white on brick face | both | `white` #FFFFFF | `orange-800` #884300 | 7.37 | text (4.5) | pass | `packages/ui/district/tones.ts:160`, `packages/ui/dropdown.ts:30` |
| banner white on brick face | both | `ink-50` #F8F8F8 | `orange-800` #884300 | 6.94 | text (4.5) | pass | `packages/ui/district/tones.ts:160` |
| night on white face | both | `ink-950` #00041C | `ink-50` #F8F8F8 | 19.12 | text (4.5) | pass | `packages/ui/district/tones.ts:167`, `packages/ui/Badge.tsx:113` |
| selected event: white on gold-700 | both | `white` #FFFFFF | `gold-700` #A35100 | 5.62 | text (4.5) | pass | token contract |
| selected event: white on forest-700 | both | `white` #FFFFFF | `forest-700` #2C7A29 | 5.35 | text (4.5) | pass | token contract |
| selected event: white on sky-700 | both | `white` #FFFFFF | `sky-700` #3577B0 | 4.75 | text (4.5) | pass | token contract |
| selected event: white on rose-700 | both | `white` #FFFFFF | `rose-700` #AE0000 | 7.50 | text (4.5) | pass | token contract |
| orange field edge | both | `orange-500` #FC7C00 | `ink-950` #00041C | 7.76 | ui (3) | pass | `packages/ui/district/tones.ts:124`, `packages/ui/cards/neon-field.ts:38` |
| royal field edge | both | `royal-500` #0058F8 | `ink-950` #00041C | 3.63 | ui (3) | pass | `packages/ui/district/tones.ts:132`, `packages/ui/cards/neon-field.ts:38` |
| carolina field edge | both | `carolina-500` #4BA8F0 | `ink-950` #00041C | 7.89 | ui (3) | pass | `packages/ui/district/tones.ts:139`, `packages/ui/cards/neon-field.ts:38` |
| leaf field edge | both | `leaf-500` #3FAE3A | `ink-950` #00041C | 7.09 | ui (3) | pass | `packages/ui/district/tones.ts:146`, `packages/ui/cards/neon-field.ts:38` |
| apple field edge | both | `apple-500` #F80000 | `ink-950` #00041C | 4.83 | ui (3) | pass | `packages/ui/district/tones.ts:154`, `packages/ui/cards/neon-field.ts:38` |
| brick field edge | both | `orange-700` #A35100 | `ink-950` #00041C | 3.61 | ui (3) | pass | `packages/ui/district/tones.ts:161`, `packages/ui/control-look.ts:54` |
| switch off: track edge | both | `silver-600` #A3A6AB | `ink-950` #00041C | 8.32 | ui (3) | pass | `packages/ui/cards/NeonSwitch.tsx:26` |
| switch off: thumb on track | both | `silver-400` #CED0D1 | `ink-900` #14182E | 11.31 | ui (3) | pass | `packages/ui/cards/NeonSwitch.tsx:26` |
| switch on: thumb keyline on orange-500 | both | `ink-950` #00041C | `orange-500` #FC7C00 | 7.76 | ui (3) | pass | `packages/ui/cards/NeonSwitch.tsx:25`, `packages/ui/cards/NeonSwitch.tsx:31` |
| switch on: thumb keyline on carolina-500 | both | `ink-950` #00041C | `carolina-500` #4BA8F0 | 7.89 | ui (3) | pass | `packages/ui/cards/NeonSwitch.tsx:25`, `packages/ui/cards/NeonSwitch.tsx:31` |
| switch on: thumb keyline on leaf-500 | both | `ink-950` #00041C | `leaf-500` #3FAE3A | 7.09 | ui (3) | pass | `packages/ui/cards/NeonSwitch.tsx:25`, `packages/ui/cards/NeonSwitch.tsx:31` |
| switch on: thumb keyline on apple-500 | both | `ink-950` #00041C | `apple-500` #F80000 | 4.83 | ui (3) | pass | `packages/ui/cards/NeonSwitch.tsx:25`, `packages/ui/cards/NeonSwitch.tsx:31` |
| switch on: thumb fill on royal-500 | both | `ink-50` #F8F8F8 | `royal-500` #0058F8 | 5.27 | ui (3) | pass | `packages/ui/cards/NeonSwitch.tsx:25`, `packages/ui/cards/NeonSwitch.tsx:31` |
| switch on: thumb fill on orange-800 | both | `ink-50` #F8F8F8 | `orange-800` #884300 | 6.94 | ui (3) | pass | `packages/ui/cards/NeonSwitch.tsx:25`, `packages/ui/cards/NeonSwitch.tsx:31` |
| checkbox off: box edge | both | `silver-500` #BEC0C2 | `ink-950` #00041C | 11.13 | ui (3) | pass | `packages/ui/cards/NeonCheckbox.tsx:24` |
| slider thumb on track | both | `ink-50` #F8F8F8 | `ink-950` #00041C | 19.12 | ui (3) | pass | `packages/ui/Slider.web.tsx:24`, `packages/ui/Slider.web.tsx:30` |
| chart series: orange | both | `orange-500` #FC7C00 | `ink-950` #00041C | 7.76 | ui (3) | pass | `packages/ui/district/series.ts:21`, `packages/ui/charts/NeonLineChart.tsx:128` |
| chart series: royal | both | `royal-500` #0058F8 | `ink-950` #00041C | 3.63 | ui (3) | pass | `packages/ui/district/series.ts:20`, `packages/ui/charts/NeonLineChart.tsx:128` |
| chart series: carolina | both | `carolina-500` #4BA8F0 | `ink-950` #00041C | 7.89 | ui (3) | pass | `packages/ui/district/series.ts:20`, `packages/ui/charts/NeonLineChart.tsx:128` |
| chart series: leaf | both | `leaf-500` #3FAE3A | `ink-950` #00041C | 7.09 | ui (3) | pass | `packages/ui/district/series.ts:21`, `packages/ui/charts/NeonLineChart.tsx:128` |
| chart series: apple | both | `apple-500` #F80000 | `ink-950` #00041C | 4.83 | ui (3) | pass | `packages/ui/district/series.ts:21`, `packages/ui/charts/NeonLineChart.tsx:128` |
| chart series: brick | both | `orange-700` #A35100 | `ink-950` #00041C | 3.61 | ui (3) | pass | `packages/ui/district/series.ts:10`, `packages/ui/district/series.ts:22` |
| chart keyline: royal under orange | both | `royal-500` #0058F8 | `orange-500` #FC7C00 | 2.14 | decorative (0) | exempt | `packages/ui/district/series.ts:75`, `packages/ui/charts/NeonLineChart.tsx:129`; the wordmark keyline under a stroke; the stroke against night carries the data |
| night facade border | both | `ink-800` #25293D | `ink-950` #00041C | 1.41 | decorative (0) | exempt | `packages/ui/DataTable.tsx:30`, `packages/ui/SegmentedControl.web.tsx:13`, `packages/ui/charts/StoryPanel.tsx:8`; container keylines; the selected segment face and cell text identify content |
| night control keyline | both | `ink-700` #3C3F51 | `ink-950` #00041C | 1.96 | decorative (0) | exempt | `packages/ui/DataTable.tsx:52`, `packages/ui/cards/neon-field.ts:26`; frame around a control whose glyph or label (white / silver-100 / silver-300) identifies it |
| outline knock-out | light | `surface` #FFF7F0 | `surface` #FFF7F0 | 1.00 | decorative (0) | exempt | `packages/ui/text-effects/OutlineText.tsx:63`; fills the glyph face with the surface; the outline stroke carries the text |
| outline knock-out | dark | `surface` #00041C | `surface` #00041C | 1.00 | decorative (0) | exempt | `packages/ui/text-effects/OutlineText.tsx:63`; fills the glyph face with the surface; the outline stroke carries the text |
| daylit: signage-black on orange-50 | both | `signage-black` #000000 | `orange-50` #FFF7F0 | 19.81 | text (4.5) | pass | token contract |
| daylit: signage-black on orange-100 | both | `signage-black` #000000 | `orange-100` #FFEDDB | 18.39 | text (4.5) | pass | token contract |
| daylit: signage-black on white | both | `signage-black` #000000 | `white` #FFFFFF | 21.00 | text (4.5) | pass | token contract |
| daylit: muted concrete-600 on orange-50 | both | `concrete-600` #61656A | `orange-50` #FFF7F0 | 5.54 | text (4.5) | pass | token contract |
| daylit: muted concrete-600 on orange-100 | both | `concrete-600` #61656A | `orange-100` #FFEDDB | 5.14 | text (4.5) | pass | token contract |
| daylit: muted concrete-600 on white | both | `concrete-600` #61656A | `white` #FFFFFF | 5.87 | text (4.5) | pass | token contract |
| daylit: secondary concrete-700 on orange-50 | both | `concrete-700` #484C51 | `orange-50` #FFF7F0 | 8.16 | text (4.5) | pass | token contract |
| daylit: secondary concrete-700 on orange-100 | both | `concrete-700` #484C51 | `orange-100` #FFEDDB | 7.57 | text (4.5) | pass | token contract |
| daylit: large/ui grey concrete-500 on page | both | `concrete-500` #7C8085 | `orange-50` #FFF7F0 | 3.75 | large-text (3) | pass | token contract; never body text; large text and marks only |
| daylit: CTA label | both | `signage-black` #000000 | `carolina-500` #4BA8F0 | 8.16 | text (4.5) | pass | token contract |
| daylit: CTA pressed label | both | `signage-black` #000000 | `carolina-600` #4191D2 | 6.21 | text (4.5) | pass | token contract |
| daylit: link royal-600 on orange-50 | both | `royal-600` #004CD9 | `orange-50` #FFF7F0 | 6.53 | text (4.5) | pass | token contract |
| daylit: danger apple-600 on orange-50 | both | `apple-600` #D50000 | `orange-50` #FFF7F0 | 5.17 | text (4.5) | pass | token contract |
| daylit: success leaf-700 on orange-50 | both | `leaf-700` #2C7A29 | `orange-50` #FFF7F0 | 5.05 | text (4.5) | pass | token contract |
| daylit: info carolina-800 on orange-50 | both | `carolina-800` #295D8E | `orange-50` #FFF7F0 | 6.50 | text (4.5) | pass | token contract |
| daylit: link royal-600 on orange-100 | both | `royal-600` #004CD9 | `orange-100` #FFEDDB | 6.06 | text (4.5) | pass | token contract |
| daylit: danger apple-600 on orange-100 | both | `apple-600` #D50000 | `orange-100` #FFEDDB | 4.80 | text (4.5) | pass | token contract |
| daylit: success leaf-700 on orange-100 | both | `leaf-700` #2C7A29 | `orange-100` #FFEDDB | 4.69 | text (4.5) | pass | token contract |
| daylit: info carolina-800 on orange-100 | both | `carolina-800` #295D8E | `orange-100` #FFEDDB | 6.03 | text (4.5) | pass | token contract |
| daylit: hairline concrete-200 on page | both | `concrete-200` #D2D4D6 | `orange-50` #FFF7F0 | 1.40 | decorative (0) | exempt | `packages/theme/tokens.ts:150`; `border` on daylit: dividers and frames around controls whose label identifies them |
| daylit: keyline concrete-400 on page | both | `concrete-400` #9A9EA2 | `orange-50` #FFF7F0 | 2.54 | decorative (0) | exempt | `packages/theme/tokens.ts:78`; decorative keylines (docs/DESIGN_SYSTEM.md concrete-400); no information |
| hlynk: LED on in the black head | both | `led-on` #F80000 | `hlynk-core-black` #000000 | 4.99 | ui (3) | pass | token contract |
| hlynk: trackpad ring on pad face | both | `hlynk-core-ring` #F80000 | `hlynk-core-black` #000000 | 4.99 | ui (3) | pass | token contract |
| hlynk: black control edge on body | both | `hlynk-core-black` #000000 | `hlynk-core-body` #D50000 | 3.83 | ui (3) | pass | token contract; the key, pad and head edges identify each control; black is never text on the body |
| hlynk: key glyph | both | `hlynk-core-glyph` #DFE0E1 | `hlynk-core-black` #000000 | 15.89 | ui (3) | pass | token contract |
| hlynk: key glyph pressed | both | `hlynk-core-glyph-pressed` #FFFFFF | `hlynk-core-black` #000000 | 21.00 | ui (3) | pass | token contract |
| hlynk: text on body | both | `hlynk-core-ink` #FFFFFF | `hlynk-core-body` #D50000 | 5.48 | text (4.5) | pass | token contract |
| hlynk: hatch rim on pad face | both | `hlynk-core-hatch-rim` #FC7C00 | `hlynk-core-black` #000000 | 8.02 | ui (3) | pass | token contract |
| hlynk: hatch orange on night | both | `hlynk-core-hatch-rim` #FC7C00 | `ink-950` #00041C | 7.76 | text (4.5) | pass | token contract |
| hlynk: body on daylit page | both | `hlynk-core-body` #D50000 | `orange-50` #FFF7F0 | 5.17 | decorative (0) | exempt | `packages/theme/tokens.ts:188`; the shell is not a control; its edge needs no ratio (measures 5.12 anyway) |
| hlynk: body on night page | both | `hlynk-core-body` #D50000 | `ink-950` #00041C | 3.70 | decorative (0) | exempt | `packages/theme/tokens.ts:188`; the shell is not a control; its edge needs no ratio (measures 3.70 anyway) |
| hlynk: LED off in the black head | both | `led-off` #5E0000 | `hlynk-core-black` #000000 | 1.48 | decorative (0) | exempt | `packages/theme/tokens.ts:174`; the unlit lens; LED state is never conveyed by the LED alone (a text chip sits in the screen) |
| hlynk: disabled key glyph | both | `hlynk-core-glyph-disabled` #484C51 | `hlynk-core-black` #000000 | 2.43 | disabled (0) | exempt | `packages/theme/tokens.ts:198`; inactive key |
| scene plate headline | both | `orange-500` #FC7C00 | `ink-800` #25293D | 5.48 | large-text (3) | pass | token contract; display-sm heading and the display-xl 404 on the plate |
| scene plate title | both | `ink-50` #F8F8F8 | `ink-800` #25293D | 13.51 | large-text (3) | pass | token contract |
| scene plate body | both | `silver-200` #ECECED | `ink-800` #25293D | 12.16 | text (4.5) | pass | token contract |
| scene plate line | both | `silver-300` #DFE0E1 | `ink-800` #25293D | 10.86 | text (4.5) | pass | token contract |
| scene plate tab label | both | `silver-200` #ECECED | `ink-900` #14182E | 14.82 | text (4.5) | pass | token contract |
| scene plate tab edge | both | `ink-400` #90929C | `ink-800` #25293D | 4.63 | ui (3) | pass | token contract |
| scene plate selected tab label | both | `ink-950` #00041C | `orange-500` #FC7C00 | 7.76 | text (4.5) | pass | token contract |
| scene plate selected tab face | both | `orange-500` #FC7C00 | `ink-800` #25293D | 5.48 | ui (3) | pass | token contract |
| console: signage band headline | both | `signage-white` #FFFFFF | `signage-black` #000000 | 21.00 | text (4.5) | pass | token contract |
| console: signage band detail | both | `signage-white/85` #D9D9D9 | `signage-black` #000000 | 14.84 | text (4.5) | pass | token contract |
| disabled label | both | `ink-400` #90929C | `ink-950` #00041C | 6.55 | disabled (0) | exempt | `packages/ui/Button.tsx:48`, `packages/ui/IconButton.tsx:79`, `packages/ui/neon/NeonChevron.tsx:55`, `packages/ui/audio/PlayerShell.tsx:123`; inactive control |
| disabled slider icon | both | `ink-700` #3C3F51 | `ink-950` #00041C | 1.96 | disabled (0) | exempt | `packages/ui/cards/CardSlider.shared.tsx:159`; inactive control |

<!-- contrast:usage:end -->

### Token contract

<!-- contrast:contract:start -->

| Pair | Mode | Foreground | Background | Ratio | Role (min) | Result | Where used |
|---|---|---|---|---:|---|---|---|
| contract:text/bg | light | `text` #000000 | `bg` #FFF7F0 | 19.81 | text (4.5) | pass | token contract |
| contract:text/bg | dark | `text` #F8F8F8 | `bg` #00041C | 19.12 | text (4.5) | pass | token contract |
| contract:text/surface | light | `text` #000000 | `surface` #FFF7F0 | 19.81 | text (4.5) | pass | token contract |
| contract:text/surface | dark | `text` #F8F8F8 | `surface` #00041C | 19.12 | text (4.5) | pass | token contract |
| contract:text/surface-raised | light | `text` #000000 | `surface-raised` #FFFFFF | 21.00 | text (4.5) | pass | token contract |
| contract:text/surface-raised | dark | `text` #F8F8F8 | `surface-raised` #0A1230 | 17.31 | text (4.5) | pass | token contract |
| contract:text/surface-sunken | light | `text` #000000 | `surface-sunken` #FFEDDB | 18.39 | text (4.5) | pass | token contract |
| contract:text/surface-sunken | dark | `text` #F8F8F8 | `surface-sunken` #000212 | 19.44 | text (4.5) | pass | token contract |
| contract:text-muted/bg | light | `text-muted` #61656A | `bg` #FFF7F0 | 5.54 | text (4.5) | pass | token contract |
| contract:text-muted/bg | dark | `text-muted` #BEC0C2 | `bg` #00041C | 11.13 | text (4.5) | pass | token contract |
| contract:text-muted/surface | light | `text-muted` #61656A | `surface` #FFF7F0 | 5.54 | text (4.5) | pass | token contract |
| contract:text-muted/surface | dark | `text-muted` #BEC0C2 | `surface` #00041C | 11.13 | text (4.5) | pass | token contract |
| contract:text-muted/surface-raised | light | `text-muted` #61656A | `surface-raised` #FFFFFF | 5.87 | text (4.5) | pass | token contract |
| contract:text-muted/surface-raised | dark | `text-muted` #BEC0C2 | `surface-raised` #0A1230 | 10.08 | text (4.5) | pass | token contract |
| contract:text-muted/surface-sunken | light | `text-muted` #61656A | `surface-sunken` #FFEDDB | 5.14 | text (4.5) | pass | token contract |
| contract:text-muted/surface-sunken | dark | `text-muted` #BEC0C2 | `surface-sunken` #000212 | 11.31 | text (4.5) | pass | token contract |
| contract:text-secondary/bg | light | `text-secondary` #484C51 | `bg` #FFF7F0 | 8.16 | text (4.5) | pass | token contract |
| contract:text-secondary/bg | dark | `text-secondary` #BEC0C2 | `bg` #00041C | 11.13 | text (4.5) | pass | token contract |
| contract:text-secondary/surface | light | `text-secondary` #484C51 | `surface` #FFF7F0 | 8.16 | text (4.5) | pass | token contract |
| contract:text-secondary/surface | dark | `text-secondary` #BEC0C2 | `surface` #00041C | 11.13 | text (4.5) | pass | token contract |
| contract:text-secondary/surface-raised | light | `text-secondary` #484C51 | `surface-raised` #FFFFFF | 8.65 | text (4.5) | pass | token contract |
| contract:text-secondary/surface-raised | dark | `text-secondary` #BEC0C2 | `surface-raised` #0A1230 | 10.08 | text (4.5) | pass | token contract |
| contract:text-secondary/surface-sunken | light | `text-secondary` #484C51 | `surface-sunken` #FFEDDB | 7.57 | text (4.5) | pass | token contract |
| contract:text-secondary/surface-sunken | dark | `text-secondary` #BEC0C2 | `surface-sunken` #000212 | 11.31 | text (4.5) | pass | token contract |
| contract:primary/bg | light | `primary` #003FB6 | `bg` #FFF7F0 | 8.30 | text (4.5) | pass | token contract |
| contract:primary/bg | dark | `primary` #FC7C00 | `bg` #00041C | 7.76 | text (4.5) | pass | token contract |
| contract:primary/surface | light | `primary` #003FB6 | `surface` #FFF7F0 | 8.30 | text (4.5) | pass | token contract |
| contract:primary/surface | dark | `primary` #FC7C00 | `surface` #00041C | 7.76 | text (4.5) | pass | token contract |
| contract:primary/surface-raised | light | `primary` #003FB6 | `surface-raised` #FFFFFF | 8.80 | text (4.5) | pass | token contract |
| contract:primary/surface-raised | dark | `primary` #FC7C00 | `surface-raised` #0A1230 | 7.02 | text (4.5) | pass | token contract |
| contract:primary/surface-sunken | light | `primary` #003FB6 | `surface-sunken` #FFEDDB | 7.71 | text (4.5) | pass | token contract |
| contract:primary/surface-sunken | dark | `primary` #FC7C00 | `surface-sunken` #000212 | 7.88 | text (4.5) | pass | token contract |
| contract:accent/bg | light | `accent` #004CD9 | `bg` #FFF7F0 | 6.53 | text (4.5) | pass | token contract |
| contract:accent/bg | dark | `accent` #4BA8F0 | `bg` #00041C | 7.89 | text (4.5) | pass | token contract |
| contract:accent/surface | light | `accent` #004CD9 | `surface` #FFF7F0 | 6.53 | text (4.5) | pass | token contract |
| contract:accent/surface | dark | `accent` #4BA8F0 | `surface` #00041C | 7.89 | text (4.5) | pass | token contract |
| contract:accent/surface-raised | light | `accent` #004CD9 | `surface-raised` #FFFFFF | 6.92 | text (4.5) | pass | token contract |
| contract:accent/surface-raised | dark | `accent` #4BA8F0 | `surface-raised` #0A1230 | 7.14 | text (4.5) | pass | token contract |
| contract:accent/surface-sunken | light | `accent` #004CD9 | `surface-sunken` #FFEDDB | 6.06 | text (4.5) | pass | token contract |
| contract:accent/surface-sunken | dark | `accent` #4BA8F0 | `surface-sunken` #000212 | 8.02 | text (4.5) | pass | token contract |
| contract:success/bg | light | `success` #2C7A29 | `bg` #FFF7F0 | 5.05 | text (4.5) | pass | token contract |
| contract:success/bg | dark | `success` #3FAE3A | `bg` #00041C | 7.09 | text (4.5) | pass | token contract |
| contract:success/surface | light | `success` #2C7A29 | `surface` #FFF7F0 | 5.05 | text (4.5) | pass | token contract |
| contract:success/surface | dark | `success` #3FAE3A | `surface` #00041C | 7.09 | text (4.5) | pass | token contract |
| contract:success/surface-raised | light | `success` #2C7A29 | `surface-raised` #FFFFFF | 5.35 | text (4.5) | pass | token contract |
| contract:success/surface-raised | dark | `success` #3FAE3A | `surface-raised` #0A1230 | 6.42 | text (4.5) | pass | token contract |
| contract:success/surface-sunken | light | `success` #2C7A29 | `surface-sunken` #FFEDDB | 4.69 | text (4.5) | pass | token contract |
| contract:success/surface-sunken | dark | `success` #3FAE3A | `surface-sunken` #000212 | 7.20 | text (4.5) | pass | token contract |
| contract:danger/bg | light | `danger` #D50000 | `bg` #FFF7F0 | 5.17 | text (4.5) | pass | token contract |
| contract:danger/bg | dark | `danger` #FA4040 | `bg` #00041C | 5.68 | text (4.5) | pass | token contract |
| contract:danger/surface | light | `danger` #D50000 | `surface` #FFF7F0 | 5.17 | text (4.5) | pass | token contract |
| contract:danger/surface | dark | `danger` #FA4040 | `surface` #00041C | 5.68 | text (4.5) | pass | token contract |
| contract:danger/surface-raised | light | `danger` #D50000 | `surface-raised` #FFFFFF | 5.48 | text (4.5) | pass | token contract |
| contract:danger/surface-raised | dark | `danger` #FA4040 | `surface-raised` #0A1230 | 5.14 | text (4.5) | pass | token contract |
| contract:danger/surface-sunken | light | `danger` #D50000 | `surface-sunken` #FFEDDB | 4.80 | text (4.5) | pass | token contract |
| contract:danger/surface-sunken | dark | `danger` #FA4040 | `surface-sunken` #000212 | 5.77 | text (4.5) | pass | token contract |
| contract:info/bg | light | `info` #295D8E | `bg` #FFF7F0 | 6.50 | text (4.5) | pass | token contract |
| contract:info/bg | dark | `info` #4BA8F0 | `bg` #00041C | 7.89 | text (4.5) | pass | token contract |
| contract:info/surface | light | `info` #295D8E | `surface` #FFF7F0 | 6.50 | text (4.5) | pass | token contract |
| contract:info/surface | dark | `info` #4BA8F0 | `surface` #00041C | 7.89 | text (4.5) | pass | token contract |
| contract:info/surface-raised | light | `info` #295D8E | `surface-raised` #FFFFFF | 6.88 | text (4.5) | pass | token contract |
| contract:info/surface-raised | dark | `info` #4BA8F0 | `surface-raised` #0A1230 | 7.14 | text (4.5) | pass | token contract |
| contract:info/surface-sunken | light | `info` #295D8E | `surface-sunken` #FFEDDB | 6.03 | text (4.5) | pass | token contract |
| contract:info/surface-sunken | dark | `info` #4BA8F0 | `surface-sunken` #000212 | 8.02 | text (4.5) | pass | token contract |
| contract:on-primary/primary | light | `on-primary` #FFFFFF | `primary` #003FB6 | 8.80 | text (4.5) | pass | token contract |
| contract:on-primary/primary | dark | `on-primary` #00041C | `primary` #FC7C00 | 7.76 | text (4.5) | pass | token contract |
| contract:on-primary/primary-pressed | light | `on-primary` #FFFFFF | `primary-pressed` #003193 | 11.29 | text (4.5) | pass | token contract |
| contract:on-primary/primary-pressed | dark | `on-primary` #00041C | `primary-pressed` #FD9D40 | 9.74 | text (4.5) | pass | token contract |
| contract:on-cta/cta | light | `on-cta` #000000 | `cta` #4BA8F0 | 8.16 | text (4.5) | pass | token contract |
| contract:on-cta/cta | dark | `on-cta` #00041C | `cta` #78BEF4 | 10.12 | text (4.5) | pass | token contract |
| contract:on-cta/cta-pressed | light | `on-cta` #000000 | `cta-pressed` #4191D2 | 6.21 | text (4.5) | pass | token contract |
| contract:on-cta/cta-pressed | dark | `on-cta` #00041C | `cta-pressed` #A5D4F8 | 12.93 | text (4.5) | pass | token contract |
| contract:on-accent/accent | light | `on-accent` #FFFFFF | `accent` #004CD9 | 6.92 | text (4.5) | pass | token contract |
| contract:on-accent/accent | dark | `on-accent` #00041C | `accent` #4BA8F0 | 7.89 | text (4.5) | pass | token contract |
| contract:on-accent/accent-pressed | light | `on-accent` #FFFFFF | `accent-pressed` #003FB6 | 8.80 | text (4.5) | pass | token contract |
| contract:on-accent/accent-pressed | dark | `on-accent` #00041C | `accent-pressed` #78BEF4 | 10.12 | text (4.5) | pass | token contract |
| contract:on-success/success | light | `on-success` #FFFFFF | `success` #2C7A29 | 5.35 | text (4.5) | pass | token contract |
| contract:on-success/success | dark | `on-success` #00041C | `success` #3FAE3A | 7.09 | text (4.5) | pass | token contract |
| contract:on-danger/danger | light | `on-danger` #FFFFFF | `danger` #D50000 | 5.48 | text (4.5) | pass | token contract |
| contract:on-danger/danger | dark | `on-danger` #00041C | `danger` #FA4040 | 5.68 | text (4.5) | pass | token contract |
| contract:on-info/info | light | `on-info` #FFFFFF | `info` #295D8E | 6.88 | text (4.5) | pass | token contract |
| contract:on-info/info | dark | `on-info` #00041C | `info` #4BA8F0 | 7.89 | text (4.5) | pass | token contract |
| contract:text-inverse/text | light | `text-inverse` #F8F8F8 | `text` #000000 | 19.77 | text (4.5) | pass | token contract |
| contract:text-inverse/text | dark | `text-inverse` #00041C | `text` #F8F8F8 | 19.12 | text (4.5) | pass | token contract |
| contract:tone-orange-text/bg | light | `tone-orange-text` #884300 | `bg` #FFF7F0 | 6.95 | text (4.5) | pass | token contract |
| contract:tone-orange-text/bg | dark | `tone-orange-text` #FD9D40 | `bg` #00041C | 9.74 | text (4.5) | pass | token contract |
| contract:tone-orange-text/surface | light | `tone-orange-text` #884300 | `surface` #FFF7F0 | 6.95 | text (4.5) | pass | token contract |
| contract:tone-orange-text/surface | dark | `tone-orange-text` #FD9D40 | `surface` #00041C | 9.74 | text (4.5) | pass | token contract |
| contract:tone-orange-text/surface-raised | light | `tone-orange-text` #884300 | `surface-raised` #FFFFFF | 7.37 | text (4.5) | pass | token contract |
| contract:tone-orange-text/surface-raised | dark | `tone-orange-text` #FD9D40 | `surface-raised` #0A1230 | 8.82 | text (4.5) | pass | token contract |
| contract:tone-orange-text/surface-sunken | light | `tone-orange-text` #884300 | `surface-sunken` #FFEDDB | 6.45 | text (4.5) | pass | token contract |
| contract:tone-orange-text/surface-sunken | dark | `tone-orange-text` #FD9D40 | `surface-sunken` #000212 | 9.90 | text (4.5) | pass | token contract |
| contract:tone-royal-text/bg | light | `tone-royal-text` #004CD9 | `bg` #FFF7F0 | 6.53 | text (4.5) | pass | token contract |
| contract:tone-royal-text/bg | dark | `tone-royal-text` #80ACFC | `bg` #00041C | 8.92 | text (4.5) | pass | token contract |
| contract:tone-royal-text/surface | light | `tone-royal-text` #004CD9 | `surface` #FFF7F0 | 6.53 | text (4.5) | pass | token contract |
| contract:tone-royal-text/surface | dark | `tone-royal-text` #80ACFC | `surface` #00041C | 8.92 | text (4.5) | pass | token contract |
| contract:tone-royal-text/surface-raised | light | `tone-royal-text` #004CD9 | `surface-raised` #FFFFFF | 6.92 | text (4.5) | pass | token contract |
| contract:tone-royal-text/surface-raised | dark | `tone-royal-text` #80ACFC | `surface-raised` #0A1230 | 8.08 | text (4.5) | pass | token contract |
| contract:tone-royal-text/surface-sunken | light | `tone-royal-text` #004CD9 | `surface-sunken` #FFEDDB | 6.06 | text (4.5) | pass | token contract |
| contract:tone-royal-text/surface-sunken | dark | `tone-royal-text` #80ACFC | `surface-sunken` #000212 | 9.07 | text (4.5) | pass | token contract |
| contract:tone-carolina-text/bg | light | `tone-carolina-text` #295D8E | `bg` #FFF7F0 | 6.50 | text (4.5) | pass | token contract |
| contract:tone-carolina-text/bg | dark | `tone-carolina-text` #78BEF4 | `bg` #00041C | 10.12 | text (4.5) | pass | token contract |
| contract:tone-carolina-text/surface | light | `tone-carolina-text` #295D8E | `surface` #FFF7F0 | 6.50 | text (4.5) | pass | token contract |
| contract:tone-carolina-text/surface | dark | `tone-carolina-text` #78BEF4 | `surface` #00041C | 10.12 | text (4.5) | pass | token contract |
| contract:tone-carolina-text/surface-raised | light | `tone-carolina-text` #295D8E | `surface-raised` #FFFFFF | 6.88 | text (4.5) | pass | token contract |
| contract:tone-carolina-text/surface-raised | dark | `tone-carolina-text` #78BEF4 | `surface-raised` #0A1230 | 9.17 | text (4.5) | pass | token contract |
| contract:tone-carolina-text/surface-sunken | light | `tone-carolina-text` #295D8E | `surface-sunken` #FFEDDB | 6.03 | text (4.5) | pass | token contract |
| contract:tone-carolina-text/surface-sunken | dark | `tone-carolina-text` #78BEF4 | `surface-sunken` #000212 | 10.29 | text (4.5) | pass | token contract |
| contract:tone-leaf-text/bg | light | `tone-leaf-text` #225E1F | `bg` #FFF7F0 | 7.37 | text (4.5) | pass | token contract |
| contract:tone-leaf-text/bg | dark | `tone-leaf-text` #6FC26B | `bg` #00041C | 9.29 | text (4.5) | pass | token contract |
| contract:tone-leaf-text/surface | light | `tone-leaf-text` #225E1F | `surface` #FFF7F0 | 7.37 | text (4.5) | pass | token contract |
| contract:tone-leaf-text/surface | dark | `tone-leaf-text` #6FC26B | `surface` #00041C | 9.29 | text (4.5) | pass | token contract |
| contract:tone-leaf-text/surface-raised | light | `tone-leaf-text` #225E1F | `surface-raised` #FFFFFF | 7.81 | text (4.5) | pass | token contract |
| contract:tone-leaf-text/surface-raised | dark | `tone-leaf-text` #6FC26B | `surface-raised` #0A1230 | 8.41 | text (4.5) | pass | token contract |
| contract:tone-leaf-text/surface-sunken | light | `tone-leaf-text` #225E1F | `surface-sunken` #FFEDDB | 6.84 | text (4.5) | pass | token contract |
| contract:tone-leaf-text/surface-sunken | dark | `tone-leaf-text` #6FC26B | `surface-sunken` #000212 | 9.44 | text (4.5) | pass | token contract |
| contract:tone-apple-text/bg | light | `tone-apple-text` #AE0000 | `bg` #FFF7F0 | 7.08 | text (4.5) | pass | token contract |
| contract:tone-apple-text/bg | dark | `tone-apple-text` #FA4040 | `bg` #00041C | 5.68 | text (4.5) | pass | token contract |
| contract:tone-apple-text/surface | light | `tone-apple-text` #AE0000 | `surface` #FFF7F0 | 7.08 | text (4.5) | pass | token contract |
| contract:tone-apple-text/surface | dark | `tone-apple-text` #FA4040 | `surface` #00041C | 5.68 | text (4.5) | pass | token contract |
| contract:tone-apple-text/surface-raised | light | `tone-apple-text` #AE0000 | `surface-raised` #FFFFFF | 7.50 | text (4.5) | pass | token contract |
| contract:tone-apple-text/surface-raised | dark | `tone-apple-text` #FA4040 | `surface-raised` #0A1230 | 5.14 | text (4.5) | pass | token contract |
| contract:tone-apple-text/surface-sunken | light | `tone-apple-text` #AE0000 | `surface-sunken` #FFEDDB | 6.57 | text (4.5) | pass | token contract |
| contract:tone-apple-text/surface-sunken | dark | `tone-apple-text` #FA4040 | `surface-sunken` #000212 | 5.77 | text (4.5) | pass | token contract |
| contract:tone-brick-text/bg | light | `tone-brick-text` #602F00 | `bg` #FFF7F0 | 10.41 | text (4.5) | pass | token contract |
| contract:tone-brick-text/bg | dark | `tone-brick-text` #FEBE80 | `bg` #00041C | 12.47 | text (4.5) | pass | token contract |
| contract:tone-brick-text/surface | light | `tone-brick-text` #602F00 | `surface` #FFF7F0 | 10.41 | text (4.5) | pass | token contract |
| contract:tone-brick-text/surface | dark | `tone-brick-text` #FEBE80 | `surface` #00041C | 12.47 | text (4.5) | pass | token contract |
| contract:tone-brick-text/surface-raised | light | `tone-brick-text` #602F00 | `surface-raised` #FFFFFF | 11.03 | text (4.5) | pass | token contract |
| contract:tone-brick-text/surface-raised | dark | `tone-brick-text` #FEBE80 | `surface-raised` #0A1230 | 11.29 | text (4.5) | pass | token contract |
| contract:tone-brick-text/surface-sunken | light | `tone-brick-text` #602F00 | `surface-sunken` #FFEDDB | 9.66 | text (4.5) | pass | token contract |
| contract:tone-brick-text/surface-sunken | dark | `tone-brick-text` #FEBE80 | `surface-sunken` #000212 | 12.67 | text (4.5) | pass | token contract |
| contract:focus/bg | light | `focus` #3577B0 | `bg` #FFF7F0 | 4.49 | ui (3) | pass | token contract |
| contract:focus/bg | dark | `focus` #4BA8F0 | `bg` #00041C | 7.89 | ui (3) | pass | token contract |
| contract:focus/surface | light | `focus` #3577B0 | `surface` #FFF7F0 | 4.49 | ui (3) | pass | token contract |
| contract:focus/surface | dark | `focus` #4BA8F0 | `surface` #00041C | 7.89 | ui (3) | pass | token contract |
| contract:focus/surface-raised | light | `focus` #3577B0 | `surface-raised` #FFFFFF | 4.75 | ui (3) | pass | token contract |
| contract:focus/surface-raised | dark | `focus` #4BA8F0 | `surface-raised` #0A1230 | 7.14 | ui (3) | pass | token contract |
| contract:focus/surface-sunken | light | `focus` #3577B0 | `surface-sunken` #FFEDDB | 4.16 | ui (3) | pass | token contract |
| contract:focus/surface-sunken | dark | `focus` #4BA8F0 | `surface-sunken` #000212 | 8.02 | ui (3) | pass | token contract |
| contract:border-strong/bg | light | `border-strong` #004CD9 | `bg` #FFF7F0 | 6.53 | ui (3) | pass | token contract |
| contract:border-strong/bg | dark | `border-strong` #4082FA | `bg` #00041C | 5.60 | ui (3) | pass | token contract |
| contract:border-strong/surface | light | `border-strong` #004CD9 | `surface` #FFF7F0 | 6.53 | ui (3) | pass | token contract |
| contract:border-strong/surface | dark | `border-strong` #4082FA | `surface` #00041C | 5.60 | ui (3) | pass | token contract |
| contract:border-strong/surface-raised | light | `border-strong` #004CD9 | `surface-raised` #FFFFFF | 6.92 | ui (3) | pass | token contract |
| contract:border-strong/surface-raised | dark | `border-strong` #4082FA | `surface-raised` #0A1230 | 5.07 | ui (3) | pass | token contract |
| contract:border-strong/surface-sunken | light | `border-strong` #004CD9 | `surface-sunken` #FFEDDB | 6.06 | ui (3) | pass | token contract |
| contract:border-strong/surface-sunken | dark | `border-strong` #4082FA | `surface-sunken` #000212 | 5.69 | ui (3) | pass | token contract |
| contract:structure/bg | light | `structure` #3577B0 | `bg` #FFF7F0 | 4.49 | ui (3) | pass | token contract |
| contract:structure/bg | dark | `structure` #0058F8 | `bg` #00041C | 3.63 | ui (3) | pass | token contract |
| contract:structure/surface | light | `structure` #3577B0 | `surface` #FFF7F0 | 4.49 | ui (3) | pass | token contract |
| contract:structure/surface | dark | `structure` #0058F8 | `surface` #00041C | 3.63 | ui (3) | pass | token contract |
| contract:structure/surface-raised | light | `structure` #3577B0 | `surface-raised` #FFFFFF | 4.75 | ui (3) | pass | token contract |
| contract:structure/surface-raised | dark | `structure` #0058F8 | `surface-raised` #0A1230 | 3.28 | ui (3) | pass | token contract |
| contract:structure/surface-sunken | light | `structure` #3577B0 | `surface-sunken` #FFEDDB | 4.16 | ui (3) | pass | token contract |
| contract:structure/surface-sunken | dark | `structure` #0058F8 | `surface-sunken` #000212 | 3.69 | ui (3) | pass | token contract |

<!-- contrast:contract:end -->

### Forbidden

<!-- contrast:forbidden:start -->

| Rule | Pair | Ratio | Needs | Rule text |
|---|---|---:|---:|---|
| orange on royal | `orange-500` #FC7C00 on `royal-500` #0058F8 | 2.14 | 3 | Orange is an accent on night and neutrals; never orange text or marks on royal. |
| white on orange | `white` #FFFFFF on `orange-500` #FC7C00 | 2.62 | 4.5 | No white-on-orange labels. Orange faces take night text (on-primary in dark). |
| banner white on orange | `ink-50` #F8F8F8 on `orange-500` #FC7C00 | 2.46 | 4.5 | Same rule for the banner white. |
| white on apple | `white` #FFFFFF on `apple-500` #F80000 | 4.21 | 4.5 | Apple faces take night text below 18.66px bold. |
| orange on light | `orange-500` #FC7C00 on `ink-50` #F8F8F8 | 2.46 | 3 | Brand orange is not text, icon or chart ink on a light surface; use accent (royal-600) or primary (royal-700) there. |
| carolina on light | `carolina-500` #4BA8F0 on `ink-50` #F8F8F8 | 2.42 | 3 | carolina-500 is the daylit CTA face, not a text or mark colour; carolina text uses info (carolina-800). |
| leaf on light | `leaf-500` #3FAE3A on `ink-50` #F8F8F8 | 2.70 | 3 | Leaf on light fails even 3:1; use success (leaf-700). |
| apple on light (text) | `apple-500` #F80000 on `ink-50` #F8F8F8 | 3.96 | 4.5 | Apple on light holds 3:1 for marks only; text uses danger (apple-600). |
| royal on night (text) | `royal-500` #0058F8 on `ink-950` #00041C | 3.63 | 4.5 | Royal reads as structure on night, never as text; royal text uses royal-300. |
| orange on daylit page | `orange-500` #FC7C00 on `orange-50` #FFF7F0 | 2.47 | 3 | Orange stays a legacy tone face on the warm daylit surfaces, never text, icon or line; the daylit CTA is carolina (`cta`). |
| LED on Core body | `led-on` #F80000 on `hlynk-core-body` #D50000 | 1.30 | 3 | The LED, emitters and the trackpad ring never touch bare body plastic; they sit on black. |
| apple-400 on Core body | `apple-400` #FA4040 on `hlynk-core-body` #D50000 | 1.53 | 3 | Same for the lighter red. |
| black text on Core body | `signage-black` #000000 on `hlynk-core-body` #D50000 | 3.83 | 4.5 | Black is a control face on the body, never text. Text on the body is hlynk-core-ink (white). |
| concrete-900 keys on Core body | `concrete-900` #1C1E21 on `hlynk-core-body` #D50000 | 3.05 | 3.5 | Passes 3:1 by 0.05; too thin a margin for key edges. Core keys are pure black. |
| black keys on apple-700 | `signage-black` #000000 on `apple-700` #AE0000 | 2.80 | 3 | Why the body is not the deeper red. |
| brick face on night | `orange-800` #884300 on `ink-950` #00041C | 2.76 | 3 | Brick (orange-800) is a face colour; its control edge on night is orange-700. |

<!-- contrast:forbidden:end -->
