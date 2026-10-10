import { auth, authRuntimeConfigured } from '../../../../lib/auth';
import { corsPreflight, withCors } from '../../../../lib/cors';
import { organizationsForProfile, resolveProfile } from '../../../../lib/portal';


export async function GET(request: Request) {
  if (!authRuntimeConfigured) {
    return withCors(request, Response.json({ error: 'auth_not_configured' }, { status: 503 }));
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return withCors(request, Response.json({ error: 'unauthorized' }, { status: 401 }));
  }

  const profile = await resolveProfile(session.user);
  if (!profile) {
    return withCors(request, Response.json({ profile: null, organizations: [] }));
  }

  const organizations = await organizationsForProfile(profile);
  return withCors(request, Response.json({ profile, organizations }));
}

export function OPTIONS(request: Request) {
  return corsPreflight(request);
}
