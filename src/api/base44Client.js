import { createClient } from '@base44/sdk';

/**
 * The Base44 client. VITE_BASE44_APP_ID is injected by the Base44 build; the
 * literal is this app's own public id, kept as a fallback so a plain
 * `vite build` still gets a working client instead of a blank app.
 */
const appId = import.meta.env.VITE_BASE44_APP_ID ?? '6aca5ff33ab16f3383490010';
const serverUrl = import.meta.env.VITE_BASE44_BACKEND_URL;

export const base44 = createClient({
  appId,
  ...(serverUrl ? { serverUrl } : {}),
});