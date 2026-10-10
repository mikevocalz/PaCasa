import { base44AuthEndpoint } from './authEndpoint.mjs';

const configuredEndpoint = (import.meta.env.VITE_PACASA_AUTH_URL ?? '').trim();
const DEMO_KEY = 'pacasa.demo.portal.session';

async function request(path, options = {}) {
  const endpoint = base44AuthEndpoint(configuredEndpoint, path, window.location.origin);
  const response = await fetch(endpoint, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-PaCasa-Request': '1', ...(options.headers ?? {}) },
    signal: options.signal ?? AbortSignal.timeout(25_000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message ?? body?.error?.message ?? body?.error ?? `Request failed (${response.status})`);
  return body;
}

function readDemoSession() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(window.sessionStorage.getItem(DEMO_KEY) || 'null'); } catch { return null; }
}
function writeDemoSession(value) {
  if (typeof window === 'undefined') return;
  if (!value) window.sessionStorage.removeItem(DEMO_KEY);
  else window.sessionStorage.setItem(DEMO_KEY, JSON.stringify(value));
}
export function hasRemoteAuth() { return Boolean(configuredEndpoint); }

export async function getPortalSession() {
  if (!hasRemoteAuth()) return readDemoSession();
  const auth = await request('/api/auth/get-session', { method: 'GET' });
  if (!auth?.user) return null;
  const portal = await request('/api/portal/me', { method: 'GET' });
  return { user: auth.user, profile: portal.profile, organizations: portal.organizations ?? [] };
}

export async function signInEmail({ email, password }) {
  if (!hasRemoteAuth()) throw new Error('La función de acceso de Base44 todavía no está conectada.');
  await request('/api/auth/sign-in/email', { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) });
  return getPortalSession();
}

export async function signUpEmail({ name, email, password, accountType, organizationSlug }) {
  if (!hasRemoteAuth()) throw new Error('La función de acceso de Base44 todavía no está conectada.');
  await request('/api/auth/sign-up/email', { method: 'POST', body: JSON.stringify({ name: name.trim(), email: email.trim(), password }) });
  await request('/api/auth/sign-in/email', { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) });
  await request('/api/portal/onboard', { method: 'POST', body: JSON.stringify({ accountType, organizationSlug: organizationSlug || null }) });
  return getPortalSession();
}

export async function signOut() {
  if (hasRemoteAuth()) await request('/api/auth/sign-out', { method: 'POST', body: '{}' });
  writeDemoSession(null);
}

/** Explicit consent and an authenticated Base44 session; no history or audio payload. */
export async function translatePortalPhrase({ text, sourceLanguage, targetLanguage, consent, signal }) {
  if (!hasRemoteAuth()) throw new Error('El traductor de Base44 todavía no está conectado.');
  return request('/assistant', { method: 'POST', signal,
    body: JSON.stringify({ mode: 'translate', text, sourceLanguage, targetLanguage, consent: consent === true }) });
}

export async function signInDemo(role) {
  if (hasRemoteAuth()) {
    // A public bundle must never contain a provider password. Seeded accounts use normal sign-in.
    throw new Error('Introduce el correo y la contraseña de prueba facilitados por tu equipo. Las credenciales no se incluyen en la aplicación.');
  }
  const provider = role === 'provider';
  const session = {
    user: { id: provider ? 'demo-provider-elena' : 'demo-patient-rosa', name: provider ? 'Dra. Elena Ruiz' : 'Rosa Velázquez', email: provider ? 'elena.ruiz@demo.pacasa.test' : 'rosa.patient@demo.pacasa.test' },
    profile: { id: provider ? 'profile-provider-elena' : 'profile-patient-rosa', accountType: provider ? 'provider' : 'patient', status: 'active', displayName: provider ? 'Dra. Elena Ruiz' : 'Rosa Velázquez', preferredLanguage: provider ? 'en' : 'es' },
    organizations: [{ id: '11111111-1111-4111-8111-111111111111', slug: 'clinica-san-miguel', name: 'Clínica San Miguel' }],
    demo: true,
  };
  writeDemoSession(session);
  return session;
}
