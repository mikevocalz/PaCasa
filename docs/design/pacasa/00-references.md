# 00 — References (Mobbin research digest)

Live references pulled via Mobbin MCP `search_screens` on 2026-02 (iOS
platform, standard mode). Screen images were examined inline; observations
below describe what the returned images show, not what the app name implies.
These are **research references, not approvals** — borrow structure, never
visuals or IP.

Standards read alongside (primary sources per ROSTER): NHS service design
principles and NHS App patterns, AHRQ Health Literacy Universal Precautions
Toolkit, WCAG 2.2.

## Inicio — `/` (start or resume the visit)

| Reference | Observation | Learn | Do NOT copy |
|---|---|---|---|
| [Ro — Get support](https://mobbin.com/screens/ef315b82-f09c-4047-b3f3-3db0a1583c5b) | Plain-language self-serve topic list ("I need a refill", "I want to switch medications") under one bold question header; five-item bottom tab bar | Direct, first-person task phrasing scans fast; a single "what do you need" question framing the whole screen | Five commerce tabs (Shop) and dense list length; Pa'Casa keeps 4 tabs + center action |
| [Noom — Today](https://mobbin.com/screens/d368daf7-b4c1-4bd1-91ea-1f4a77c7917d) | Dashboard stacks a progress bar, checklist-style "Challenges" card with "Did it today!" states, and content cards | Resume-what's-next ordering: progress first, then the next action | Gamified streaks/coins and promotional cards — out of place in intake |
| [Lovi — Today](https://mobbin.com/screens/c0048d26-0a9c-4575-a954-3f544f206b40) | "First Steps" checklist with blue check circles, then "Daily Plan" unchecked items; raised center "New Scan" in bottom nav | Checked/unchecked task rows read instantly for older adults; raised center action pattern matches Pa'Casa Live | Mascot imagery, pastel gradients, product cross-sell ("Routine for you" cards) |

## Formularios — `/native` (forms and field progress)

| Reference | Observation | Learn | Do NOT copy |
|---|---|---|---|
| [Visible — Participant survey](https://mobbin.com/screens/f8720b40-e869-41fb-9518-94575bfd6277) | One question per view: "Do you have Long Covid?" as large Yes/No pills; a second question opens a bottom-sheet picker; Cancel in header | One-concept-per-screen and large single-select pills are the core intake pattern | The dark theme and low-contrast secondary text fail the daylit direction and older-adult contrast |
| [Visible — symptom tracking](https://mobbin.com/screens/f6b0cbb2-ae52-4f90-98d9-ed6e301d4ae8) | "What symptoms would you like to track?" with category tabs (General / Brain / …) and full-width selectable rows; thin progress bar at top | Sectioned selection with a persistent top progress indicator | Tab chips as primary model — Pa'Casa asks one question at a time, not a picker grid |
| [Babbel — Review list](https://mobbin.com/screens/f8949021-6b1d-4e9f-a9b4-fa0c2b6e7d76) | Saved-item list: thumbnail, source word + translation pair, speaker icon per row, "Play all" | Per-row read-aloud affordance next to a source/translation pair — same shape as a form row's `sourceLabel` + `questionEs` + Escuchar | Bookmark icons and study-stage chrome |
| [Ro — goals intake](https://mobbin.com/screens/e08f9f36-6a0f-45ee-811b-a0c4ef8e5587) | "What do you want to accomplish with Ro?" checkbox list; Continue stays disabled until a selection | Disabled-until-valid primary button communicates required input without an error state | Greyed CTA alone as the only signal — pair with copy that says what is missing |

## Documentos — `/hybrid` (source documents and analysis)

| Reference | Observation | Learn | Do NOT copy |
|---|---|---|---|
| [Alan — Documents tab](https://mobbin.com/screens/fe47ee98-cd4d-43a4-95da-4fbab8db8c7d) | "No documents" empty state with a one-line explanation and a text link "Upload a document"; quick-action tiles above ("Send a document") | Honest empty state that teaches instead of hiding; icon + title + subtitle doc rows | Umbrella mascot branding; tab labels in English only |
| [Alan — New claim file list](https://mobbin.com/screens/f97e0fe8-da8b-4f01-bf20-4efeba3ed5e8) | Attached files listed with filename, type subtitle and a per-row remove ✕; explanatory body copy above; primary "Send the claim" | File rows carry provenance (name + type) and an explicit remove action before send | Long truncated filenames unreadable to older adults — Pa'Casa names documents by clinic/title |
| [Alan — error sheet](https://mobbin.com/screens/f8b6392b-7791-40dc-aee0-eadb7c322cea) | Modal sheet: warning icon, "An error happened", plain explanation "We have already received this document", single "Back" button | Error = one honest sentence + one recovery action | Amber alarm styling; Pa'Casa errors stay in the calm semantic palette |
| [Warby Parker — Add your prescription](https://mobbin.com/screens/e85636d6-3952-4501-973b-4944d7e5b816) | Four honest paths: "Upload a photo", "Input your prescription values", "Have us contact your doctor", "Send it to us later" — each with a one-line plain-English subtitle | Offer every real path including the human fallback; never dead-end a patient | Card density and sales-adjacent framing; Pa'Casa keeps 2–3 actions max per panel |

## Revisar — `/game` (confirm and correct answers)

| Reference | Observation | Learn | Do NOT copy |
|---|---|---|---|
| [Amazon — Place Your Order](https://mobbin.com/screens/f9ab6f96-9416-4eb3-9970-672c42355ef5) | Final review: consent microcopy, one dominant CTA, then itemized summary rows and radio options with "Change …" links | Everything reviewable in one scroll; each editable group carries its own change affordance | CTA placed *above* the content being confirmed, and commerce pressure patterns |
| [Warby Parker — prescription values](https://mobbin.com/screens/e4cc01ab-bdd0-4100-a29a-d85e2c5dadaa) | Structured value form, then an explicit checkbox: "I confirm that this information is correct and taken from a valid prescription…" before a disabled-then-enabled Continue | The explicit-confirmation gate — exactly Pa'Casa's "Sí, correcto" pattern at form scale | Dense medical-abbreviation fields (SPH/CYL/Axis) — jargon Pa'Casa translates into plain Spanish questions |
| [Babbel — dialogue review](https://mobbin.com/screens/f0e0b694-4aa8-4ee0-bb4c-45dde034c095) | Transcript shows each source line with its translation directly underneath; "Listen to dialogue" secondary action above the primary Continue | Source + target pairing in place — the same provenance pattern as `sourceLabel` over `questionEs` | Conversational bubble chrome for a clinical review list |
| [Noom — log list](https://mobbin.com/screens/f8e308a2-251f-4050-881c-75a9c83a8f97) | Ordered rows (Breakfast, Morning Snack…) each with an add/edit affordance; a single "Finish day" primary at the bottom | One edit affordance per row, one completion action per screen | Icon-only "+" affordance — Pa'Casa uses labelled "Editar" buttons |

## Ayuda — `/immersive` (secondary route: accessibility, privacy, how Pa'Casa works)

| Reference | Observation | Learn | Do NOT copy |
|---|---|---|---|
| [Ro — Getting started FAQ](https://mobbin.com/screens/fa1a9c30-1e3d-4f61-b9f5-93ed3d7dfdf9) | Section header "Getting started", then full-width rows phrased as the patient's own questions | Help content written as patient questions, grouped by topic | Deep FAQ pagination; Ayuda is one screen of grouped panels |
| [Fitbit — Activity settings](https://mobbin.com/screens/f4f413fb-ed9c-4e0d-bf44-3a8b0592a12a) | Grouped list sections ("FEATURE SETTINGS", "DATA AND PRIVACY") with value-bearing rows and chevrons | Section grouping + visible current state per row (e.g., "Voice cues: On") | Section-header ALL-CAPS styling at body scale; keep caps only on tiny kickers |
| [Fitbit — Information visibility](https://mobbin.com/screens/f4ec0726-fa6c-4f42-83be-2b44e8461b3d) | Each personal datum shows its privacy state ("Private" / "Friends") with a lock icon | Privacy states made visible and legible per item — supports the "this session is temporary" promise | Assumes an account model Pa'Casa's ephemeral session does not have |

## Pa'Casa Live — center overlay (Hablar / Traducir / Preguntar)

| Reference | Observation | Learn | Do NOT copy |
|---|---|---|---|
| [Pi — listening](https://mobbin.com/screens/7f86354d-c06a-4c2f-8396-616c1ac2995c) | Near-empty screen: "Pi is listening.." centered, soft color field, bottom row of four circular controls incl. a captions (CC) button and a clear ✕ close | Listening state is the whole screen's job; captions and exit always visible | Animated brand wave art as the only state signal — Pa'Casa adds text state ("Te escucho…") |
| [Pi — voice settings](https://mobbin.com/screens/0112183e-51de-4d68-9cf8-ec898f1d1f02) | Playback-speed slider (0.5–1.5×) with labelled stops and a voice grid picker | Speaking-rate control is an older-adult essential for read-aloud | Voice *personality* marketing; Pa'Casa exposes rate + language, not personas |
| [Perplexity — voice settings](https://mobbin.com/screens/6152580f-fa86-4874-b466-a6a6e5890bd2) | Voice list, "Subtitles — See the response transcript" toggle, AI speaking-rate slider, Save | Captions/transcript toggle as a first-class accessibility control | Requires an account-level settings screen; Pa'Casa puts Escuchar inline per question |
| [Duolingo — translate exercise](https://mobbin.com/screens/f7262955-3afd-4e31-ae9b-a90fdf91ea0e) | One exercise per screen: progress bar + ✕ at top, source sentence with speaker icon, answer options, CHECK disabled until complete | One-thing-at-a-time with explicit check/confirm — the Hablar proposal flow | Mascots, hearts, streak pressure — no game styling in patient workflows |
| [Duolingo — dialogue feedback](https://mobbin.com/screens/ee7cd425-4c81-47bb-9035-68cf979a017a) | Chat transcript with inline "Tip:" correction and a "Great ✓" confirmation card before CONTINUE | Correction shown in place with an explicit acknowledgement step | Gamified praise tone; corrections in Pa'Casa are neutral ("Así lo entendí…") |
| [Babbel — complete the dialogue](https://mobbin.com/screens/fd9a34b9-ceb8-475d-b9f6-842312902258) | Each bubble shows the foreign line with the native-language translation directly beneath | The bilingual source/target pairing pattern for Traducir results | Chat bubbles as containers for clinical phrases — use flat panels |
| [Shop — Sol voice sheet](https://mobbin.com/screens/c90189a9-ccc7-47c0-b8ed-ac163265beb9) | Bottom sheet voice mode: greeting text, one mic button, keyboard toggle | Sheet-over-content matches the overlay contract (return to underlying screen) | Assistant persona naming/avatar; voice input without a text alternative visible |

## Cross-cutting observations

- **Best pattern for older adults:** Ro and Fitbit both keep one primary action
  per screen and plain-language rows; Visible shows one-question-at-a-time
  works but its dark UI confirms why the daylit direction matters.
- **Honest states:** Alan's empty/error states and Warby Parker's
  multi-path prescription screen are the models for Pa'Casa's
  `needs_review`/`no_fields` and "no document picker on this build".
- **Explicit confirmation:** Warby Parker's confirm-checkbox and Amazon's
  review-then-place flow validate Pa'Casa's proposal→"Sí, correcto" gate;
  nothing submits without a patient action.
- **Bilingual pairing:** Babbel's source-line-over-translation layout maps
  directly to `sourceLabel` (English as printed) + `questionEs` (Spanish).
- **Anti-patterns confirmed:** gamification (Noom streaks, Duolingo
  hearts/mascots), dark low-contrast themes (Visible), emoji/personality
  chrome (Pi voices, Lovi mascots) — all excluded from patient workflows.
