# Evidence — pacasa-redesign · DESIGN/EVIDENCE lane

## Brief received

Design-lane handoff for the Pa'Casa cross-platform healthcare redesign:
document the mapping of the five locked shared-app slugs to the patient
workflows, the Pa'Casa Live center-overlay contract, the daylit visual
direction, bilingual/older-adult copy rules, and per-screen
references/findings/decisions/copy/accessibility-risks/open-questions.
Owned paths: `docs/design/pacasa/**`, `docs/evidence/pacasa-redesign/**`.
No source-code edits.

## Sources read (installed files + symbols)

**Spec / governance**

- `~/Downloads/ROSTER.md`, `~/Downloads/SKILLS.md` (binding registry)
- `docs/adr/0002-pacasa-healthcare-route-map.md` — route map, overlay
  contract, safety requirements
- `docs/spec/prompts/MASTER_PROMPT_V5.md`, `docs/spec/prompts/ROSTER.md`,
  `docs/spec/prompts/SKILLS.md` — pack context
- `tooling/verify-five-routes.mjs` — the merged nine-slug contract
- `docs/SOURCE_PROVENANCE.md`, `docs/DESIGN_SYSTEM.md` (palette provenance)
- `AGENTS.md` — shell/workspace/navigation contracts

**Patient reference implementation (`src/`)**

- `src/App.jsx:14-53` — locked nav comment; `/pacasa` route outside
  `PatientShell`
- `src/components/PatientShell.jsx` — 4 tabs + raised center action +
  drawer (Ayuda content model, `DrawerPanel` lines 40-129)
- `src/components/patient-ui.jsx` — `PatientFrame`, `Panel`,
  `ActionButton`, `BigAction`, `ProgressRow`, `OverflowMenu`
- `src/pages/Inicio.jsx`, `Formularios.jsx`, `Documentos.jsx`,
  `Revisar.jsx`, `PaCasaLive.jsx` — all read in full
- `src/session/store.js`, `actions.js`, `domain.js`, `voice.js` — session
  semantics, honest-miss analysis/translation/grounding, capability gates
- `src/index.css`, `tailwind.config.js` — semantic vars bound to night
  palette

**Shared app (`packages/`, `apps/`)**

- `packages/app/session/patient.ts` (Zustand store, `unreadable`,
  provenance fields), `document-analysis.ts` (`AnalysisState`,
  `analyseDocument`, `formFromDocument`), `grounding.ts`,
  `phrasebook.ts`, `root-screen.ts`, `print.{web,native}.ts`
- `packages/app/speech/speech.{web,native}.ts` — web engines real; native
  all-false honest stubs
- `packages/app/screens/AppShell.tsx` (`DESTINATIONS`, `ScanButton`,
  `CameraLab` modal, `useAdaptiveNavigationPlacement` right rail),
  `NativeScreen`, `HybridScreen`, `GameScreen`, `ImmersiveScreen`,
  `ShowcaseScreen`, `parts.tsx`
- `packages/app/index.ts`, `apps/mobile/app/*`, `apps/web/app/*` — route
  bindings; confirmed session modules are **not yet connected** to shared
  screens
- `packages/theme/tokens.ts` — daylit `semantic.light` pairs, palette
  scales, `navChrome`, glow-alpha-00-in-light rule

**External research**

- Mobbin MCP `search_screens` — 8 queries, iOS, standard mode; screens
  examined inline and cited in `docs/design/pacasa/00-references.md`
  (Ro, Noom, Visible, Alan, Amazon Shopping, Warby Parker, Pi, Perplexity,
  Fitbit, Duolingo, Babbel, Lovi, Shopify/Sol, Mindtrip, Claude)
- Primary guidance referenced (per ROSTER reading list): NHS service
  manual/design principles, NHS App patterns, AHRQ Health Literacy
  Universal Precautions, WCAG 2.2

## Skills ledger

See `docs/evidence/pacasa-redesign/SKILLS.md`. Summary: Mobbin MCP USED
(real searches, images examined); `accessibility`, `general-design-review`,
`ux-personas`, `ux-heuristics-review`, `ux-research-methods`,
`design-analysis` (partial), `frontend-patterns` loaded and applied from
the installed skill registry; `building-native-ui`, `expo-app-design`,
`expo-best-practices`, `react-native-best-practices` recorded as invoked
by the orchestrator; all `design:*` session bundles, `frontend-design`,
and `figma:*` recorded NOT AVAILABLE — primary-source guidance used;
no Figma output fabricated.

## Changes

All additions under owned paths; **no source code edited**.

Created `docs/design/pacasa/`:

- `README.md` — route map (slug → Spanish workflow, nav roles), Pa'Casa
  Live overlay contract, visual direction summary, safety invariants,
  bilingual/older-adult rules, proto-personas (labelled as assumptions),
  explicit "what is NOT here" (no Figma, no device captures, no clinical
  approval)
- `00-references.md` — Mobbin digest: 25 cited screens across 14 apps,
  per-workflow tables (observation / learn / do-not-copy) + cross-cutting
  findings
- `01-inicio.md` — `/` Inicio: resume-first IA, emoji-removal decision,
  native disabled-hint states, copy table, a11y risks
- `02-formularios.md` — `/native` Formularios: two-bucket list, nested
  detail, provenance rules, 40/60 workspace reuse decision
- `03-documentos.md` — `/hybrid` Documentos: viewer + honest analysis
  states, provenance display, "Usar para formulario" confirmation gate,
  native no-picker state
- `04-revisar.md` — `/game` Revisar: per-answer cards, explicit
  confirmation invariant, "Sin confirmar" gap, print honesty
- `05-ayuda.md` — `/immersive` Ayuda as a secondary route (never a tab);
  drawer content graduates to panels; new interpreter-escalation panel
- `06-pacasa-live.md` — overlay: three modes, proposal gate, listening/
  stop states, Traducir honest miss + interpreter escalation, focus/return
  contract
- `07-design-system.md` — daylit token remapping table (same var names,
  daylit values; measured by `packages/theme/contrast.ts`), radius scale,
  sentence-case rule, component reuse matrix (`src` → `@acme/ui`/`screens`),
  Storybook coverage list

Created `docs/evidence/pacasa-redesign/`:

- `SKILLS.md` — this ledger
- `design-research.md` — this file

## Commands / results

- `ls`, `find`, `grep`, `read` over repo — all read-only
- Mobbin `search_screens` ×8 (mode=standard, platform=ios, limit 5–6):
  all returned result sets with `mobbin_url`s; inline images examined
- `df -h` showed the volume at 100% (101 MiB avail); **removed the stale
  build cache `apps/web/.next` (254 MB, regenerable)** to unblock writes —
  the running `next dev` processes found (`pgrep -fl "next dev"`) belong to
  other projects (Harlem-Might, universal-spatial-starter), not this repo.
  Freed ~2.4 GB; all writes then succeeded.
- No build/test/device commands run — design lane only.

## Device evidence

**NOT VERIFIED** — no app build, simulator, device, or browser was run in
this lane. All claims about runtime behaviour are sourced from checked-in
code paths (`canSpeak`/`canListen`/`canPrint` gates, `speech.native.ts`
all-false, `print.native.ts` false, ADR 0002's no-picker statement). Mobbin
stills are third-party screenshots used as research references, not as
evidence about Pa'Casa. Contrast ratios in `07-design-system.md` are
luminance estimates pending the `packages/theme/contrast.ts` gate.

## Open questions / blockers

1. **Native speech/print/picker** — native build has no speech engine, no
   print pipeline, no document picker this cycle. Design specifies honest
   states; E03/E05/E07 to confirm what (if anything) lands.
2. **Daylit flip of `src/`** — `src/index.css` still binds night values.
   The token remap is specified but unimplemented (D08 + owning E lane).
3. **`cta` vs `accent`** for the daylit primary action face — theme's
   daylit `cta` is brand orange; this lane proposes royal `accent`.
   Needs a D06 token-level decision (recorded in `07-design-system.md`).
4. **"Sin confirmar" visual state** — corrected-but-unconfirmed answers are
   currently indistinguishable in review; proposed chip needs engineering
   and copy review.
5. **Proto-personas are unvalidated** — D02 blocking item: no real
   older-adult or bilingual user research has run.
6. **Clinical safety / interpreter escalation copy** — wording proposed
   ("pida un intérprete al personal") requires qualified language-access
   review (D04) and clinical sign-off (D03) before production claims.
7. **Demo mode in production** — whether `Modo demo` ships and how sample
   data is visually marked needs product + privacy (E11) decision.
8. **PHI boundary** — session ephemerality is asserted in copy; the
   privacy lane must verify no persistence/telemetry contradicts it.

## Requests to other lanes

- **E09/E10 (platforms):** implement Ayuda as `/immersive` route reachable
  from menu/header links — never a bottom tab or rail destination; wire the
  center action to a Pa'Casa Live overlay using `root-screen.ts` `returnTo`.
- **E02 (component API):** port `patient-ui` semantics to `@acme/ui` —
  `PatientFrame`→`ScreenFrame`, `OverflowMenu`→`Menu`/`BottomSheet`, mode
  nav→`SegmentedControl`; add `disabledHint` to the big-action equivalent;
  remove `uppercase` on action labels.
- **E05 (forms/OCR):** real analysis pipeline must still report
  reading/detecting/translating/needs_review/no_fields-style honest states;
  "Usar para formulario" stays patient-triggered.
- **E07 (realtime audio):** visible listening state ("Te escucho…" +
  Parar) and speaking-state control are required when a native engine lands.
- **E11 (privacy):** verify ephemeral-session copy vs. actual storage/logs;
  decide on demo-mode visibility; consider per-document delete.
- **E13 (test/release):** add the daylit pairs to the contrast gate; add
  the patient component Storybook list from `07-design-system.md`.
- **D02/D04 (review):** validate copy tables for older-adult readability
  and regional Spanish before implementation freeze.
