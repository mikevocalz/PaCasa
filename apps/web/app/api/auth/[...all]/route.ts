import { toNextJsHandler } from 'better-auth/next-js';
import { auth, authRuntimeConfigured } from '../../../../lib/auth';
import { corsPreflight, withCors } from '../../../../lib/cors';


const handlers = toNextJsHandler(auth);

const unavailable = (request: Request) =>
  withCors(
    request,
    Response.json(
      { error: 'auth_not_configured', message: 'Pa\'Casa auth is not configured on this deployment.' },
      { status: 503 },
    ),
  );

export async function GET(request: Request) {
  if (!authRuntimeConfigured) return unavailable(request);
  return withCors(request, await handlers.GET(request));
}

export async function POST(request: Request) {
  if (!authRuntimeConfigured) return unavailable(request);
  return withCors(request, await handlers.POST(request));
}

export function OPTIONS(request: Request) {
  return corsPreflight(request);
}
