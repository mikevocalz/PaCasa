# 06 — Pa'Casa Live (center overlay: Hablar / Traducir / Preguntar)

**Workflow:** the voice-first command surface opened by the raised center
action. **Not a sixth route** — a root-level overlay that closes back to the
exact screen it opened from (`returnTo` in the session store;
`packages/app/session/root-screen.ts`, `src/session/store.js:161-170`).
**Slug:** none — on `src/` it's the `/pacasa` route rendered outside
`PatientShell` (`src/App.jsx:45`); on the shared app it maps to the raised
center action + modal pattern (`AppShell.tsx:85-99, 206-216`).
**Reference implementation:** `src/pages/PaCasaLive.jsx`

## References

- [Pi — listening](https://mobbin.com/screens/7f86354d-c06a-4c2f-8396-616c1ac2995c): listening state as the whole screen; captions + close always present. Don't copy ambient-art-only state signalling.
- [Pi — voice settings](https://mobbin.com/screens/0112183e-51de-4d68-9cf8-ec898f1d1f02) / [Perplexity — voice settings](https://mobbin.com/screens/6152580f-fa86-4874-b466-a6a6e5890bd2): speaking rate + subtitles are accessibility controls.
- [Duolingo — translate exercise](https://mobbin.com/screens/f7262955-3afd-4e31-ae9b-a90fdf91ea0e) / [dialogue feedback](https://mobbin.com/screens/ee7cd425-4c81-47bb-9035-68cf979a017a): one exercise, progress + ✕, explicit CHECK; correction shown in place. Don't copy gamification.
- [Babbel — dialogue](https://mobbin.com/screens/f0e0b694-4aa8-4ee0-bb4c-45dde034c095): source line with translation beneath — the Traducir result pattern.
- [Shop — Sol voice sheet](https://mobbin.com/screens/c90189a9-ccc7-47c0-b8ed-ac163265beb9): sheet-over-content overlay with mic + keyboard parity.

## Findings (source audit)

`src/pages/PaCasaLive.jsx` — three modes under one header
(`MODES`, lines 10-14):

- **Header**: ✕ close (44 px) + "Pa'Casa" title; context strip naming the
  active form and "Pregunta {done+1} de {total}" (lines 38-52). Mode nav is
  three equal buttons with `aria-current` (lines 54-71).
- **Hablar** (83-191): the current question at display size + "En el
  formulario dice: {sourceLabel}" provenance; "Escuchar la pregunta"
  (gated by `canSpeak()`); a large mic button (96 px) or honest
  MicOff line when `canListen()=false`; typed fallback input; the
  **proposal gate** — "Así lo entendí" + "Sí, correcto" / "Corregir"
  (lines 140-157). Confirming writes `setAnswer` + `setConfirmed` and
  reads the answer back aloud. No speech → no pretend mic: honest
  "El dictado no está disponible aquí; escriba su respuesta."
- **Traducir** (194-259): direction toggle English→Español /
  Español→English; phrase input; `translatePhrase` returns an honest miss
  ("No tengo una traducción para esa frase. Puede usar una de las frases
  frecuentes.") rather than guessing (`phrasebook.ts:52-60`).
- **Preguntar** (262-344): `SUGGESTED_QUESTIONS` chips; grounded answers
  only — text + `sourceLabel` provenance + optional read-aloud + "Ver en
  el documento" jump; the never-advice footer "Las respuestas salen de su
  formulario y de sus propias respuestas." (line 340).
- Closing calls `stopSpeaking()` and navigates to `returnTo` (lines 31-34);
  unmount also stops speech (line 29).

Gaps:

- **Listening state is thin:** `hearing` disables the mic button but the
  screen doesn't announce "Te escucho…" textually — Pi's lesson applies:
  add a visible listening label + a stop control while listening.
- **No captions toggle / rate control:** Escuchar is replayable but not
  rate-adjustable; add later via Ayuda → Voz y audio if a real engine
  lands (native has none today).
- **Mode nav labels** are tappable segmented controls (good), but on a
  shared build the segmented control must be the existing `SegmentedControl`
  (`@acme/ui`) not a bespoke row (E02 owns; design specifies reuse).
- **Traducir miss state** should point at interpreter escalation (AHRQ/
  language-access requirement) — currently only suggests known phrases.
- No visible "speaking" indicator during read-aloud — a subtle
  "Leyendo…" state or stop button is needed (WCAG 2.2.2 pause/stop for
  auto-advancing audio is advisory, but control is required for trust).
- The overlay has no explicit "minimize/keep place" affordance — the ✕ is
  close-and-return; that's the contract, keep it single-purpose.

## Decisions

1. **Three modes, one purpose each.** Hablar = answer the current question;
   Traducir = known front-desk phrases; Preguntar = grounded questions
   about this form only. No general chat, ever.
2. **Proposal gate is sacred:** every captured answer (voice or typed) is
   shown as "Así lo entendí: {value}" and requires "Sí, correcto" before it
   writes. "Corregir" discards to editing. This is the clinical-safety
   invariant (D03 blocker if violated).
3. **Listening state is textual + controllable:** while `hearing`, show
   "Te escucho…" + a "Parar" control; never icon-only state.
4. **Read-aloud control:** while speaking, "Escuchar" becomes "Parar"
   (calls `stopSpeaking`). One control, two honest states.
5. **Traducir miss copy adds interpreter guidance:** "…Puede usar una de
   las frases frecuentes. Si es importante, pida un intérprete al
   personal." — extends the existing honest miss.
6. **Return contract:** ✕ always closes to `returnTo`; Android back and
   Escape do the same. Tab selection underneath is untouched
   (ADR 0002 + `root-screen.ts` doc).
7. **Overlay chrome:** full-screen sheet on phones; on wide/tablet a large
   centered sheet is acceptable, but the underlying screen stays visible at
   the edges only if focus trap + inert background are correct — safer
   default is full-screen sheet everywhere this cycle.

## Copy

| Slot | Copy |
|---|---|
| Header | "Pa'Casa" · context strip "{form.title} · Pregunta {n} de {total}" / "Todas las preguntas contestadas" (keep) |
| Modes | "Hablar" / "Traducir" / "Preguntar" (keep; icons lucide only) |
| Hablar question | "{questionEs}" display + "En el formulario dice: {sourceLabel}" (keep) |
| Hablar — listening | "Te escucho…" + "Parar" — **new visible state** |
| Hablar — no dictation | "El dictado no está disponible aquí; escriba su respuesta." (keep) |
| Hablar — proposal | "Así lo entendí" / "Sí, correcto" / "Corregir" (keep) |
| Hablar — done | "Formulario completo" · "Contestó {done} de {total} preguntas. Revise sus respuestas antes de terminar." (keep) |
| Traducir labels | "English → Español" / "Español → English" · "Escriba en inglés/español" · "Traducir" · "Escuchar" (keep) |
| Traducir miss | "No tengo una traducción para esa frase. Puede usar una de las frases frecuentes. Si es importante, pida un intérprete al personal." — **extended** |
| Preguntar field | "Pregúnteme sobre este formulario" (keep) |
| Preguntar footer | "Las respuestas salen de su formulario y de sus propias respuestas." (keep) |
| Preguntar — no answer | "No tengo esa información en este formulario." (engine string — keep verbatim, `grounding.ts:21`) |
| Preguntar — no form | "Todavía no hay un formulario activo. Empiece un formulario y le ayudo con las preguntas." (keep) |
| Close | aria "Cerrar Pa'Casa Live" (keep) |

All `SUGGESTED_QUESTIONS`, `QUESTION_ES`, `PHRASES` dictionaries live in
`packages/app/session/` — **they are product copy, not clinical text**; any
additions need bilingual review (D04/D05).

## Accessibility risks

- **Mode switch announces:** `aria-current` on the mode buttons (present);
  content swap should also move focus to the mode region heading or
  announce via live region — currently silent.
- **Focus management on open/close:** overlay must capture focus on open
  and return focus to the center action button on close (WCAG 2.4.3);
  on native use `accessibilityViewIsModal`.
- **Mic button while `hearing`:** needs `aria-pressed`/`aria-busy` or an
  explicit state label, plus the visible "Te escucho…" text — never rely
  on animation alone.
- **Speech output has no pause affordance** beyond closing — add "Parar".
- **Hearing-impaired path:** every spoken element must exist as text —
  it does (questions and answers are text-first; speech is additive).
- **Keyboard:** overlay must not trap `Esc` from the underlying screen —
  `Esc` closes the overlay, matching `PatientShell` drawer behaviour.
- Reduced motion: any listening pulse/animation gets a static state
  (`useReducedMotion` exists in `@acme/ui`).

## Open questions

- On native there is **no speech engine at all** (`speech.native.ts`):
  does Pa'Casa Live still open on native, presenting Hablar as a typed
  flow + Traducir + Preguntar (all usable without audio)? Design says
  **yes — text-first everywhere**, with honest "voice not available" lines.
  Confirm with E07 whether any native TTS/STT lands this cycle.
- Turn-taking for real microphone streaming (barge-in, pause) is E07's
  design when a real engine exists; this cycle's contract is
  press-to-ask once (`listen` one-shot).
- Should "Preguntar" also cover *document* questions (not just forms)?
  `groundQuestion` is form-scoped; extending to documents needs the
  analysis grounding contract — flag to E05/E06.
- Interpreter escalation in Traducir: does D04 want a stronger verb than
  "pida"? Wording is product-level; the *requirement* to escalate on
  misses is recorded.
