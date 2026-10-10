# Pa’Casa Scan: VisionCamera v5 + ExecuTorch 0.10 + Expo Camera web + Rive

## Working path (draft code)
- iOS and Android use \`@acme/camera/document-scanner\` with VisionCamera v5 **photo outputs** (\`usePhotoOutput\`, \`capturePhoto\`), always rear camera, and in-memory \`Photo.toImageAsync()\`. No v4 \`takePhoto\`.
- \`react-native-nitro-image\` provides pixel bytes plus **physical** channel layout. \`normalize.ts\` converts RGBA/BGRA/ARGB/... into the RGB HWC \`ImageBuffer\` that ExecuTorch 0.10 PP-OCRv6 expects. Bounded, resized, no frame-processor memory leak or disk photo retention.
- Recognition uses \`useOpticalCharacterRecognizer(models.ocr.PADDLE.PPOCRV6_SMALL.DEFAULT)\` *locally*. The first model download requires connectivity. Native photo never automatically leaves device.
- Browser uses Expo SDK58 \`CameraView.takePictureAsync({base64:true})\`, with explicit demo consent, and disabled-by-default Google Gemini Vision \`POST /assistant/document\`. This is **demo only, not a PHI-ready pipeline**. Captured image is not persisted by the backend.
- Recognized text always opens editable review, then a separate **Llevar texto al Chat** action stages it as text in the assistant composer. It is NOT sent until a second chat consent/send action; forms are never filled or submitted automatically.
- Rive: the scanner currently uses the **existing precompiled** \`signal-studio.riv\` for responsive motion. A dedicated \`packages/assets/rive-src/document-scan/{rive.yaml,scene.rml}\` RML variant is authored for the latest CLI; it is **not yet compiled**. Run \`rive packages/assets/rive-src/document-scan --once\`, inspect and regenerate via \`pnpm rive:build\` (check actual script), check colors/artboard and bind progress to document scanner stages. The final animated binary is a merge blocker; do not claim it exists.
- Only application semantic UI components and the already-owned RiveStage are used. No raw HTML.

## Security and release blockers
- \`pnpm install\` and regenerate **pnpm-lock.yaml** for ExecuTorch 0.10.0 and Expo Camera 58.0.9. Verify Expo SDK 58 / RN 0.88 peers, iOS pods and Android runtime.
- Validate Google's OCR languages, orientation handling, small text, glare, multiple pages, handwriting, browser permission denial, revoked permission, offline, and CJK/Spanish documents.
- Add authenticated API, provider BAA, encryption/audit, retention limits, consent logs and a redaction pipeline before actual patient data. CORS alone is not authorization.
- Limit doc scans to <2.2MB base64 for demo service. Do not send real patient records.
- Run app + camera tests/typechecks/CI, device tests, backend integration tests with fake images, and Web capture on Chrome/Safari. No tests have been executed in this connector environment.

## Skills and references
Read the repo skill manifest and Margelo VisionCamera v5 quickstart/capture-and-controls, exact NitroImage \`RawPixelData\` API, React Native ExecuTorch 0.10 PP-OCRv6 guide, Expo SDK58 Camera docs, and Rive CLI project guide. The new Rive CLI executable was not available to run here.
