const AUTH_PATHS = new Set(['/api/auth/get-session', '/api/auth/sign-in/email', '/api/auth/sign-up/email', '/api/auth/sign-out']);

export function configuredBase44Origin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      !['/', '/functions/pacasaAuth', '/functions/pacasaAuth/'].includes(url.pathname)) return null;
    return url.origin;
  } catch { return null; }
}

/** Better Fetch/Expo plugins still own cookie storage. Only the HTTP target is rewritten. */
export function createBase44AuthFetch(origin: string | null, fetchImpl: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    if (!origin) throw new Error('EXPO_PUBLIC_PACASA_AUTH_URL must be the HTTPS Base44 app origin.');
    const request = new Request(input, init);
    const source = new URL(request.url);
    if (source.origin !== origin || !AUTH_PATHS.has(source.pathname) || source.hash || source.username || source.password)
      throw new Error('Unsupported PaCasa authentication request.');
    // The gateway always bypasses cookie caching. Do not allow arbitrary forwarded query parameters.
    for (const [key, value] of source.searchParams) {
      if (source.pathname !== '/api/auth/get-session' || key !== 'disableCookieCache' || !['true', 'false'].includes(value))
        throw new Error('Unsupported PaCasa authentication query.');
    }
    const target = new URL('/functions/pacasaAuth', origin);
    target.searchParams.set('path', source.pathname);
    const headers = new Headers(request.headers);
    headers.set('X-PaCasa-Request', '1');
    headers.set('expo-origin', 'pacasa://');
    // Preserve the Cookie header attached by expoClient; never log it or add it to the URL.
    return fetchImpl(new Request(target, new Request(request, { headers, credentials: 'omit' })));
  };
}
