# Pa’Casa streaming OpenUI: maps and routing

A Chat directions request (English or Spanish) is resolved **server-side** with Google Places Text Search. We never use invented model coordinates, place names or arbitrary URLs. If the Places lookup fails, the regular text reply remains readable and **no fake map card appears**.

- Input: spoken/typed chat such as "directions to Mount Sinai Hospital" or "cómo llegar a Central Park".
- Server: \`GOOGLE_MAPS_API_KEY\` enables Places Text Search and Maps Static API; no key is exposed to the client. The static image is proxied by fixed \`GET /assistant/map?lat=...&lng=...\` after bounded lat/lng validation and rate limiting. This endpoint is an unprotected preview service in the draft; add per-user authentication/quotas before production.
- Output: strict \`DirectionsMap(name,address,latitude,longitude)\` OpenUI registry component rendered with the app's own \`Image\`, \`View\`, \`Pressable\`, \`Text\`. Its route action constructs Google's documented directions URL solely from validated numeric coordinates, then uses React Native Linking (also supported on web).
- This does NOT include live travel-time or turn-by-turn navigation inside Pa’Casa. The user explicitly presses the button to open the maps app.
- Next/Image remote image config requires explicit validation against configured assistant service host (and Android emulator networking needs a reachable HTTPS endpoint).
- Don't infer clinic address/identity from patient histories or private record metadata.

## Tests to run
\`pnpm --filter assistant-api test\`, \`pnpm --filter @acme/chat-ui test\`, typechecks and browser/mobile route-button tests. Confirm a failed Google Places lookup, rate limiting, tampered coordinates, Maps API disabled, offline, and unsupported languages. No tests have been executed inside the GitHub connector.

## Skills applied
Read Margelo \`api-design\`, Vercel \`ai-sdk\`, React best practices and project skill manifest. Exact Google Places v1 and Maps Static contracts must be verified again before enabling production billing.
