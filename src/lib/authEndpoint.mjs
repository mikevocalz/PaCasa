const FUNCTION_PATH = '/functions/pacasaAuth';
const ALLOWED_ROUTES = new Set(['/api/auth/get-session', '/api/auth/sign-in/email',
  '/api/auth/sign-up/email', '/api/auth/sign-out', '/api/portal/me', '/api/portal/onboard', '/assistant']);

/** Same-origin cookies are required; no credentials ever go to a model-selected or third-party URL. */
export function base44AuthEndpoint(configured, route, browserOrigin) {
  if (!ALLOWED_ROUTES.has(route) || !configured || !browserOrigin) throw new Error('Configuración de acceso incompleta.');
  const base = new URL(browserOrigin);
  const local = ['localhost', '127.0.0.1'].includes(base.hostname);
  if (base.protocol !== 'https:' && !(local && base.protocol === 'http:')) throw new Error('Pa’Casa requiere una conexión segura.');
  const target = new URL(configured, base.origin);
  if (target.origin !== base.origin || target.username || target.password || target.search || target.hash)
    throw new Error('El acceso debe usar la función de este mismo sitio Base44.');
  if (target.pathname === '/') target.pathname = FUNCTION_PATH;
  if (target.pathname.replace(/\/$/, '') !== FUNCTION_PATH) throw new Error('La función de acceso Base44 no es válida.');
  target.pathname = FUNCTION_PATH;
  target.searchParams.set('path', route);
  return target.toString();
}
