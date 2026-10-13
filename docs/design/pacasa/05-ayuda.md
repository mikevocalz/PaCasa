# 05 — Ayuda `/immersive` (secondary route)

**Workflow:** accessibility, voice status, privacy, and how Pa'Casa works —
help, not a demo. Secondary route per ADR 0002: reached from the
header menu/drawer and links, **never a bottom tab position**.
**Slug:** `/immersive` (locked). Shared slug currently renders
`ImmersiveScreen` (Orbit Lab) — `apps/web/app/immersive/page.tsx`,
`apps/mobile/app/immersive.tsx`.
**Reference implementation:** the drawer panels in
`src/components/PatientShell.jsx` (`DrawerPanel`, lines 40-129) — this
content graduates to a real route on the shared app.

## References

- [Ro — Getting started FAQ](https://mobbin.com/screens/fa1a9c30-1e3d-4f61-b9f5-93ed3d7dfdf9): patient-phrased question rows grouped by topic.
- [Fitbit — Activity settings](https://mobbin.com/screens/f4f413fb-ed9c-4e0d-bf44-3a8b0592a12a): grouped sections with visible current state per row.
- [Fitbit — Information visibility](https://mobbin.com/screens/f4ec0726-fa6c-4f42-83be-2b44e8461b3d): per-item privacy state (Private/Friends) made legible.
- [Alan — Useful documents](https://mobbin.com/screens/fbffa606-5b2c-4f3d-9020-2d6cfff79f7a): icon + title + "why" subtitle rows.

## Findings (source audit)

The drawer already contains the Ayuda content model
(`PatientShell.jsx:30-38`, panels `40-129`):

- **Accesibilidad** — plain-language summary of large buttons, system text
  size, contrast, screen-reader labels, reduced motion.
- **Voz y audio** — honest capability statements driven by
  `canSpeak()`/`canListen()` (lines 52-58).
- **Cómo funciona** — the 4-step explanation (upload → find questions →
  answer speaking → review & generate).
- **Privacidad** — "Esta sesión es temporal… no es un expediente médico"
  (lines 71-78).
- **Modo demo** — sample visit toggle (lines 87-113).
- **Estado del micrófono** — `microphoneAvailable()`/`canListen()` honest
  status (lines 79-86).
- **Acerca de Pa'Casa** — one-paragraph product truth.

Gaps:

- On the shared app this must be a **real route** (`/immersive`), not a
  drawer — the drawer pattern can remain as the entry point, but the content
  deserves a URL (deep-linkable help; E09 owns routing).
- Drawer items are icon+label rows, `min-h-14` (line 266) — fine; on the
  Ayuda screen each topic becomes a `Panel` section.
- **Missing content the direction requires:** interpreter escalation
  ("if a translation affects your care, ask for a qualified interpreter")
  and a plain-language "what Pa'Casa will never do" (no auto-submit, no
  medical advice). Neither exists yet — new copy below.
- Voz y audio has no volume/rate control — consider linking to the OS
  speech settings guidance only (no in-app engine to tune on web).

## Decisions

1. **Ayuda is a destination, not a tab.** Entry points: header menu button,
   "Acerca de/Ayuda" links from Inicio footer, and deep link. On the native
   shell it sits inside the right-rail menu / header menu, never consuming
   a rail destination slot (rail positions = the four primary workflows).
2. **Panel-per-topic**, ordered: Cómo funciona → Voz y audio →
   Accesibilidad → Privacidad → Idiomas e intérpretes → Estado del
   micrófono → Acerca de. Modo demo stays in the drawer/menu (staff/dev
   affordance, not patient help).
3. **Capability states are live, not static:** voice/mic sections read
   `canSpeak`/`canListen`/`microphoneAvailable` and say so truthfully —
   the existing copy pattern is exactly right; keep the pattern on the
   shared app via `packages/app/speech` status helpers
   (`voiceInputStatus`/`speechOutputStatus`).
4. **Add the interpreter-escalation panel** ("Idiomas e intérpretes"):
   Pa'Casa's translations are product copy for intake paperwork, and for
   anything that affects care the patient should ask for a qualified
   interpreter — required by the language-access lane (D04).
5. **Privacy copy stays humble:** "temporary session on this device, not a
   medical record" — keep; add "Pa'Casa no envía nada a su clínica sin que
   usted lo confirme" to reinforce no-auto-submit.

## Copy

| Section | Copy |
|---|---|
| Kicker / title | "Ayuda" / "Ayuda y cómo funciona Pa'Casa" |
| Cómo funciona | Keep the 4-step ordered list (`PatientShell.jsx:61-69`), numbered and in plain sentences |
| Voz y audio (speech on) | "Pa'Casa puede leerle las preguntas y sus respuestas en voz alta." (keep) |
| Voz y audio (speech off) | "Este dispositivo no tiene voz de lectura." (keep) |
| Dictation on/off | "También puede dictar sus respuestas." / "El dictado no está disponible aquí; puede escribir sus respuestas." (keep) |
| Accesibilidad | Keep existing two sentences; add "Puede hacer todas las tareas con el teclado o con el lector de pantalla." — **new line** |
| Privacidad | Keep + "Pa'Casa no envía nada a su clínica sin que usted lo confirme." — **new** |
| Idiomas e intérpretes (**new panel**) | "Pa'Casa traduce frases comunes de recepción y lee el formulario en español. Las traducciones son para ayudarle con el papeleo. Si una respuesta afecta su salud, pida un intérprete calificado al personal de la clínica." |
| Mic status | Keep `microphoneAvailable`/`canListen` honest pair (lines 82-85) |
| Acerca | Keep both sentences (`PatientShell.jsx:115-119`) |
| Modo demo | Keep in drawer only: "Ahora mismo está cargada la visita de ejemplo…" |

## Accessibility risks

- If Ayuda renders as panels on a route, headings must be real headings
  (h2 per panel) so a screen-reader user can jump sections — the drawer's
  `DrawerText` already uses `h2`; keep that on the route.
- Help content in long paragraphs fails low-literacy users — keep each
  panel to ≤3 short sentences or a numbered list (AHRQ universal
  precautions: chunk and sequence).
- Don't bury Ayuda: the menu button needs a visible label ("Menú" not just
  a glyph) at phone width — current impl has icon-only menu button
  (`PatientShell.jsx:183-191`); add a visible "Menú" label or an
  "Ayuda" entry inside Inicio's footer as redundancy.
- Live capability text must update if permissions change while the page is
  open (e.g., mic granted in Settings) — `aria-live="polite"` on the status
  lines, or re-read state on focus.

## Open questions

- Does Ayuda need a **contact/reception path** ("Pida ayuda en recepción")?
  No phone number exists in the product; safest honest copy is the
  reception-desk guidance — confirm with product (D01/E15).
- Should interpreter escalation also live in Pa'Casa Live's Traducir miss
  state? Design says yes — noted in `06-pacasa-live.md`.
- Is "Modo demo" acceptable to keep in production builds at all? Privacy
  lane (E11) + product must decide — if it ships, it needs an obvious
  "sample visit" banner on demo data screens.
