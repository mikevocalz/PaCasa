# SKILLS ledger — pacasa-redesign (design lane)

Policy: a skill counts as USED only if its `SKILL.md` or session bundle was
actually loaded this session. Unavailable registry entries are recorded
`NOT AVAILABLE — used primary-source guidance`.

| Skill | Loaded from | Task / files | Artifact | Status |
|---|---|---|---|---|
| mobbin `search_screens` | Mobbin MCP server (installed) | Per-screen live references, ≥3 per workflow; images examined inline | `docs/design/pacasa/00-references.md` + per-screen reference sections | USED — 8 searches, 43 screens returned, referenced 25 |
| `accessibility` | `~/.claude/skills/accessibility/SKILL.md` | WCAG review frame + screenshot-evidence limits | `05-a11y`-equivalent sections inside `docs/design/pacasa/01..06-*.md` | USED — WCAG 2.2 framing applied; interaction-only checks flagged as needs-verification |
| `general-design-review` | `~/.claude/skills/general-design-review/SKILL.md` | Critique structure (verdict → top issues → changes) | Findings/Decisions sections in each screen file | USED |
| `ux-personas` | `~/.claude/skills/ux-personas/SKILL.md` | Proto-persona discipline — assumptions labelled, not invented research | `README.md` proto-personas | USED — personas explicitly marked unvalidated |
| `ux-heuristics-review` | `~/.claude/skills/ux-heuristics-review/SKILL.md` | Heuristic lens on `src/` reference screens | Gaps/decisions in `01..06-*.md` | USED |
| `ux-research-methods` | `~/.claude/skills/ux-research-methods/SKILL.md` | Research-vs-assumption framing | `README.md`, open questions | USED |
| `design-analysis` | `~/.claude/skills/design-analysis/SKILL.md` | Measured-not-guessed rule applied to tokens (values read from `tokens.ts`/`index.css`) | `07-design-system.md` | PARTIAL — capture script not run (no app build running); used for measured-extraction discipline |
| `frontend-patterns` | `~/.claude/skills/frontend-patterns/SKILL.md` | Composition framing for reuse matrix | `07-design-system.md` reuse matrix | USED (light) |
| `building-native-ui` (Expo) | invoked by orchestrator | Shared-screen native shell conventions | README route/nav notes | INVOKED (orchestrator) |
| `expo-app-design` (Expo) | invoked by orchestrator | Cross-platform app design conventions | README | INVOKED (orchestrator) |
| `expo-best-practices` (Expo) | invoked by orchestrator | Expo capability boundaries | README + honest-state decisions | INVOKED (orchestrator) |
| `react-native-best-practices` (Callstack) | invoked by orchestrator | RN performance/list conventions | screen notes | INVOKED (orchestrator) |
| `design:user-research` | session bundle | research proto-personas | `README.md` | NOT AVAILABLE — used primary-source guidance (AHRQ/NHS) + `ux-personas` |
| `design:design-handoff` | session bundle | screen anatomy/routes/states | `01..06-*.md` anatomy + findings | NOT AVAILABLE — handoff written by hand from source |
| `design:design-system` | session bundle | token mapping / reuse | `07-design-system.md` | NOT AVAILABLE — used `packages/theme/tokens.ts` + `contrast.ts` directly |
| `design:ux-copy` | session bundle | ES/EN strings | Copy tables in `01..06-*.md` | NOT AVAILABLE — copy follows AHRQ universal precautions + existing repo strings |
| `design:accessibility-review` | session bundle | WCAG 2.2 checks | a11y sections per screen | NOT AVAILABLE — used installed `accessibility` skill + WCAG 2.2 primary source |
| `design:design-critique` | session bundle | weighted critique | findings/open questions | NOT AVAILABLE — used `general-design-review` + `ux-heuristics-review` |
| `design:research-synthesis` | session bundle | cross-screen findings brief | `README.md` + `00-references.md` | NOT AVAILABLE — synthesis written by hand |
| `frontend-design` (Anthropic) | session bundle | implementation design memo | `07-design-system.md` direction | NOT AVAILABLE — direction authored from repo tokens + Mobbin evidence |
| `figma:*` (bundle) | Figma MCP | design file/token library | — | NOT AVAILABLE — no Figma connector; Markdown handoff produced instead |
| `argent/agent-device` | `~/.agents/skills/agent-device` | device QA | — | INSTALLED, NOT RUN — no device evidence this lane |
| `pbakaus/impeccable` | registry | screenshot quality review | — | NOT AVAILABLE — no running app to screenshot |
| `no-ai-slop` | `~/.claude/skills/no-ai-slop` | release gate | — | LOADED (installed) — applied as honesty rule to evidence claims |
| `engineering:code-review` | session bundle | code review | — | OUT OF LANE — design lane made no code changes |
| `viroreact-*` spatial skills | registry | XR design | — | NOT APPLICABLE — no XR code touched; `/immersive` is the Ayuda route |
