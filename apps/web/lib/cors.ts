import 'server-only';

const allowedOrigins = new Set(
  (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);

export function isTrustedOrigin(origin: string | null) {
  if (!origin) return true;
  return allowedOrigins.has(origin);
}

export function withCors(request: Request, response: Response) {
  const origin = request.headers.get('origin');
  if (origin && allowedOrigins.has(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.append('Vary', 'Origin');
  }
  return response;
}

export function corsPreflight(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin || !allowedOrigins.has(origin)) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'content-type, authorization',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      Vary: 'Origin',
    },
  });
}
