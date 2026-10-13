# 03 — Documentos `/hybrid`

**Workflow:** the visit's source documents — upload, view, hear, analyse,
and turn a document into a form (patient-confirmed).
**Slug:** `/hybrid` (locked). Shared slug currently renders `HybridScreen`
(Rive signal studio) — `apps/web/app/hybrid/page.tsx`,
`apps/mobile/app/hybrid.tsx`.
**Reference implementation:** `src/pages/Documentos.jsx`

## References

- [Alan — Documents tab](https://mobbin.com/screens/fe47ee98-cd4d-43a4-95da-4fbab8db8c7d): honest empty state + "Upload a document".
- [Alan — claim file list](https://mobbin.com/screens/f97e0fe8-da8b-4f01-bf20-4efeba3ed5e8): file rows with type + per-row remove; explicit send.
- [Alan — error sheet](https://mobbin.com/screens/f8b6392b-7791-40dc-aee0-eadb7c322cea): one-sentence error + one recovery action.
- [Warby Parker — prescription options](https://mobbin.com/screens/e85636d6-3952-4501-973b-4944d7e5b816): multiple honest paths incl. human fallback.

## Findings (source audit)

`src/pages/Documentos.jsx` — two states: list and viewer.

**List** (lines 147-204): upload CTA; document rows with title, clinic,
kind, page count or "sin leer todavía"; per-row "Ver" + `OverflowMenu`
(Analizar / Escuchar / Usar para formulario — the last disabled when the
analysis has no fields, line 191).

**Viewer** (lines 50-144): back link; toolbar with prev/next page
(`min-h-11` square buttons), zoom out/in (0.85–2 rem), fit toggle,
"Escuchar" (gated by `canSpeak()`), "Preguntar a Pa'Casa", and primary
"Analizar". Document body renders extracted text on a `silver-50` "paper"
surface inside a dark stage; honest fallback "No pude leer el texto de este
archivo todavía." when a page has no text. In-document search with page-jump
results.

**AnalysisPanel** (lines 208-245): staged honesty — `reading` → `detecting`
→ `translating` → settled (`ready` / `needs_review` / `no_fields`) driven by
`analyseDocument` (`document-analysis.ts:57-74`). Detected fields list
provenance: "En el formulario dice · página {n}" + `sourceLabel` + "En
español: {questionEs}". Unreadable labels listed by name ("No pude leer
bien: …"). "Usar para formulario" only offered on `ready` — patient action
required; nothing auto-populates (ADR safety requirement).

Gaps:

- `runAnalysis` simulates stages with `setTimeout`s (`Documentos.jsx:29-38`)
  — fine for the demo, but the staged labels must map to real pipeline
  states when a real analyzer lands (E05 owns; design keeps the three-step
  disclosure).
- Page counter renders "— / —" when `pages.length === 0` — good; but a
  document with no pages still shows the toolbar mostly disabled — ensure
  the disabled cluster doesn't look broken (see decisions).
- Search input is real (`Documentos.jsx:101-124`) — keep; it's the one
  feature helping staff find a field fast.
- The viewer stage is dark (`bg-ink-900`) around a white paper sheet —
  intentional contrast, works in the daylit direction; keep the paper white
  but the surrounding chrome follows daylit tokens.
- Native shared build: **no document picker** — "Subir PDF" must render the
  honest unsupported state (ADR 0002, `print.native.ts` precedent).

## Decisions

1. **Provenance is always visible:** every detected field shows page +
   `sourceLabel` + `questionEs` (existing). Add "Ver en el documento"
   page-jump consistency with the Preguntar mode (`PaCasaLive.jsx:326-334`).
2. **Unreadable ≠ failure:** `needs_review` lists exactly which labels were
   unreadable and offers "Intentar de nuevo" + "Ver documento". Never auto-
   guess. `no_fields` says the document isn't a form; both get retry + view.
3. **"Usar para formulario"** is offered only on `ready` and always shows
   what it will create (fields already listed above). This is the
   design-level confirmation gate for E05's "no unverified extraction
   auto-populates".
4. **Toolbar on native:** on the shared native build the same actions apply —
   Escuchar hidden/disabled-hinted per `speech.native.ts` all-false; the
   toolbar collapses to an overflow (`OverflowMenu` precedent) at compact
   widths rather than wrapping to three rows.
5. **Upload on native** renders `disabled` + hint "No se pueden subir
   documentos en esta versión. Recepción puede subirlos por usted." — same
   honesty rule as Inicio.
6. Keep the 40/60 split possibility on wide: list left, viewer right —
   matches the `NativeScreen` workspace contract; the viewer keeps its own
   internal toolbar inside the detail pane.

## Copy

| Slot | Copy |
|---|---|
| Kicker / title | "Documentos" / "Sus documentos" (keep) |
| Lead | "Los papeles de esta visita: lo que subió, lo que Pa'Casa leyó y lo que puede preguntarle." (keep) |
| Upload panel | "Subir un documento" · "Subir PDF" |
| Empty session | "Todavía no hay documentos en esta sesión." (keep) |
| Row meta | "{clinic} · PDF/Imagen · {n} páginas / sin leer todavía" (keep) |
| Analysis stages | "Estoy leyendo el documento…" / "Estoy encontrando las preguntas…" / "Estoy preparando las preguntas en español…" (keep — `ANALYSIS_COPY`) |
| Analysis settled | "Encontré {n} preguntas." / "Hay una parte que no pude leer bien." / "Este documento no tiene preguntas para el formulario." (keep) |
| Field provenance | "En el formulario dice · página {n}" / `{sourceLabel}` / "En español: {questionEs}" (keep) |
| Unreadable list | "No pude leer bien: {labels}." (keep) |
| Page empty | "No pude leer el texto de este archivo todavía." (keep) |
| Search | "Buscar en el documento" placeholder; "No encontré esa palabra." (keep) |
| Upload unsupported (native) | "No se pueden subir documentos en esta versión. Recepción puede subirlos por usted." — **new** |
| Escuchar unavailable | (button disabled; tooltip/announcement) "Este dispositivo no puede leer en voz alta." — **new** |

## Accessibility risks

- **Page text zoom** is a custom `rem` scale (0.85–2) — must not break
  VoiceOver reading order; the paper sheet is `whitespace-pre-wrap` text, so
  screen readers read it fine, but confirm focus doesn't land on the paper
  itself (it isn't interactive — keep it that way).
- **Disabled toolbar cluster:** 6+ small buttons; ensure ≥44 px targets and
  that disabled reasons are announced (`aria-disabled` + visible hint, not
  silent greying).
- **aria-live on analysis copy** (`Documentos.jsx:214`) is correct; verify
  the four stage messages don't spam — announce only on state change
  (already batched per state; keep one assertive-free `polite` region).
- **In-document search** needs a result-count announcement ("3 páginas
  encontradas") for parity with the visible list.
- Dark stage + white paper: fine for content contrast; ensure the daylit
  chrome around it doesn't drop the paper's edge contrast below 3:1 for its
  border (non-text contrast, WCAG 1.4.11).

## Open questions

- Real analysis pipeline (OCR/vision model) is E05's lane — the staged
  copy assumes ≥3 honest states; confirm the real pipeline can report them
  (or map onto reading/detecting/translating as coarse stages).
- Retake/reglare flow for a bad photo is undefined — with no native picker
  this cycle, design keeps upload-only; flag to E05 for the capture design.
- Should "Escuchar" read the whole document or the current page? Current
  impl reads page 1's text (`Documentos.jsx:40-43`) — decision: **current
  page**, and copy stays "Escuchar" (scoped by the visible page).
- Document privacy: does the ephemeral session need an explicit "Eliminar"
  per document? The Alan remove-✕ pattern suggests yes; raise with E11
  (PHI boundary on a shared device).
