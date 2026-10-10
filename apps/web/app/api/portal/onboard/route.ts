import { auth, authRuntimeConfigured } from '../../../../lib/auth';
import { corsPreflight, withCors } from '../../../../lib/cors';
import { onboardProfile, organizationsForProfile, type PortalAccountType } from '../../../../lib/portal';


export async function POST(request: Request) {
  if (!authRuntimeConfigured) {
    return withCors(request, Response.json({ error: 'auth_not_configured' }, { status: 503 }));
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return withCors(request, Response.json({ error: 'unauthorized' }, { status: 401 }));
  }

  const body = (await request.json().catch(() => null)) as
    | { accountType?: unknown; organizationSlug?: unknown }
    | null;

  if (body?.accountType !== 'patient' && body?.accountType !== 'provider') {
    return withCors(request, Response.json({ error: 'invalid_account_type' }, { status: 400 }));
  }

  const accountType = body.accountType as PortalAccountType;
  const organizationSlug =
    typeof body.organizationSlug === 'string' && body.organizationSlug.trim()
      ? body.organizationSlug.trim()
      : null;

  try {
    const profile = await onboardProfile({
      authUser: session.user,
      accountType,
      organizationSlug,
    });
    const organizations = await organizationsForProfile(profile);
    return withCors(request, Response.json({ profile, organizations }));
  } catch (error) {
    const code = error instanceof Error ? error.message : 'onboarding_failed';
    const status = code === 'organization_required' || code === 'organization_not_found' ? 400 : 500;
    return withCors(request, Response.json({ error: code }, { status }));
  }
}

export function OPTIONS(request: Request) {
  return corsPreflight(request);
}
