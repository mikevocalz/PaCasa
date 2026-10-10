# Pa’Casa: provider ↔ patient localization and translation

## What is implemented in the Base44/Vite patient app

- On the first visit, patient-facing language reads the browser/phone's highest-priority language (`navigator.languages[0]` then `navigator.language`), accepts `en-US`, `en-GB`, `es-ES`, `es-MX` and other regional variants; unsupported languages fall back to Spanish (the existing Spanish-first demo). No language inference from a person's name, appearance, or healthcare record.
- An explicit patient language choice (`Auto / English / Español`) overrides the device and is the only localization preference saved to localStorage. Device-language refresh occurs on browser focus / page visibility changes, and choosing Auto follows the device again.
- Navigation, the drawer, and Pa’Casa Live translator interface use localized copy. The authored medical intake/demo, form-specific explanatory copy, source documents, and form answers are **not yet completely localized** and are never silently translated.
- The provider side of the Pa’Casa Live translation surface is English. The recipient patient language is resolved independently from the patient's phone preference. Provider→patient or patient→provider direction is chosen automatically; no language-direction toggle.
- Speech recognition and text-to-speech select the speaking/listening locale so English-speaking providers can dictate in English and Spanish-speaking patients can hear Spanish. Text fallback remains accessible when Web Speech APIs are missing.
- Common front desk phrases work offline in both directions. Arbitrary messages require the optional server adapter. When unavailable, an explicit status is shown instead of a fake translation.

## Configuring arbitrary message translation

The frontend accepts `VITE_PACASA_TRANSLATION_URL`, pointing to a **trusted, authenticated, HIPAA-appropriate server-side endpoint** that returns JSON:

```http
POST /api/translate
Content-Type: application/json
Cookie: <authenticated-session>

{ "text": "Please bring your insurance card", "sourceLanguage": "en", "targetLanguage": "es" }

200 OK
{ "translation": "Por favor, traiga su tarjeta del seguro" }
```

The translation service must be deployed separately; this PR **does not** ship a clinical translation backend, Supabase tables, a provider identity/portal or messaging transport. Do not configure a third-party service directly in the browser or put its API key in `VITE_*`. Server implementation must enforce provider/patient membership and role-based access, CSRF/origin controls, rate limits, no PHI logging or analytics, configured retention, permitted regions and an appropriate vendor agreement before real patient use.

Translations are initiated only by submitting/recording a message, not on every keystroke. The client preserves the original and identifies when the service is unavailable. Never mistake this demo's local preview for a provider-to-patient delivery receipt. For medical decisions, diagnoses, and consent, a qualified interpreter is still needed.

## Native follow-up / production acceptance gates

The Expo/Next workspaces currently render the spatial **starter showcase**, not the Base44 patient/provider portals. Before claiming native parity:
1. Port the patient and provider experiences into shared `@acme/app` screens and state while retaining the locked five-tab + raised center button contract and the repo's Zustand-only native rule.
2. Use `expo-localization` `getLocales()` / `useLocales()` (SDK-compatible version) for iOS/Android device language, listen for Android foreground locale changes, and expose OS per-app language selections; share translation keys across platforms.
3. Connect the provider portal's real authenticated message flow to the server translator with recipient locale stored only as an authorized preference; keep original and translation with auditability and review.
4. Complete all patient screens, document/PDF and form-question localized strings; protect authored clinical meaning, dates, medication and dosing units, and all user-entered values.
5. Test on English/Spanish iOS, Android, mobile web, server-rendered web, and with an unavailable translator (including speech denied), then conduct clinical language review.

No native-device testing or clinical HIPAA compliance verification is claimed in this PR.
