const backendOrigin = (import.meta.env.VITE_PACASA_AUTH_URL ?? '').replace(/\/$/, '');
const DEMO_KEY = 'pacasa.demo.portal.session';
const jsonHeaders = { 'Content-Type': 'application/json' };

async function request(path, options = {}) {
  const response = await fetch(`${backendOrigin}${path}`, {
    credentials: 'include',
    ...options,
    headers: { ...jsonHeaders, ...(options.headers ?? {}) },
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
export function hasRemoteAuth() { return Boolean(backendOrigin); }

export async function getPortalSession() {
  if (!hasRemoteAuth()) return readDemoSession();
  const auth = await request('/api/auth/get-session', { method: 'GET' });
  if (!auth?.user) return null;
  const portal = await request('/api/portal/me', { method: 'GET' });
  return { user: auth.user, profile: portal.profile, organizations: portal.organizations ?? [] };
}

export async function signInEmail({ email, password }) {
  if (!hasRemoteAuth()) throw new Error('El backend de Better Auth todavía no está conectado.');
  await request('/api/auth/sign-in/email', { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) });
  return getPortalSession();
}

export async function signUpEmail({ name, email, password, accountType, organizationSlug }) {
  if (!hasRemoteAuth()) throw new Error('El backend de Better Auth todavía no está conectado.');
  await request('/api/auth/sign-up/email', { method: 'POST', body: JSON.stringify({ name: name.trim(), email: email.trim(), password }) });
  await request('/api/auth/sign-in/email', { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) });
  await request('/api/portal/onboard', { method: 'POST', body: JSON.stringify({ accountType, organizationSlug: organizationSlug || null }) });
  return getPortalSession();
}

export async function signOut() {
  if (hasRemoteAuth()) await request('/api/auth/sign-out', { method: 'POST', body: '{}' });
  writeDemoSession(null);
}

const demoPassword = import.meta.env.VITE_PACASA_DEMO_PASSWORD;
const DEMO_CREDENTIALS = {
  patient: { email: 'rosa.patient@demo.pacasa.test', password: demoPassword },
  provider: { email: 'elena.ruiz@demo.pacasa.test', password: demoPassword },
};

export async function signInDemo(role) {
  if (hasRemoteAuth()) {
    if (!demoPassword) throw new Error('La contraseña de demostración no está configurada.');
    return signInEmail(DEMO_CREDENTIALS[role] ?? DEMO_CREDENTIALS.patient);
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
