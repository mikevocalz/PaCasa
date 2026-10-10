import 'server-only';

import { db } from './database';

export type PortalAccountType = 'patient' | 'provider';

interface ProfileRow {
  id: string;
  auth_user_id: string;
  account_type: PortalAccountType;
  status: 'active' | 'pending' | 'disabled';
  display_name: string;
  preferred_language: string;
  demo_email: string | null;
}

const toProfile = (row: ProfileRow) => ({
  id: row.id,
  accountType: row.account_type,
  status: row.status,
  displayName: row.display_name,
  preferredLanguage: row.preferred_language,
});

export async function resolveProfile(authUser: { id: string; email: string; name?: string | null }) {
  const direct = await db.query<ProfileRow>(
    `select id, auth_user_id, account_type, status, display_name, preferred_language, demo_email
       from app.profiles
      where auth_user_id = $1
      limit 1`,
    [authUser.id],
  );
  if (direct.rows[0]) return toProfile(direct.rows[0]);

  // Never claim a seeded patient/provider profile by self-asserted email.
  // Demo users are explicitly linked to their Better Auth IDs by the audited seed script.
  return null;
}

export async function organizationsForProfile(profile: { id: string; accountType: PortalAccountType }) {
  if (profile.accountType === 'provider') {
    const result = await db.query(
      `select o.id, o.slug, o.name, o.organization_type as "organizationType",
              o.city, o.state, pm.membership_role as "membershipRole", pm.status
         from app.provider_memberships pm
         join app.organizations o on o.id = pm.organization_id
        where pm.provider_profile_id = $1
          and pm.status = 'active'
        order by o.name`,
      [profile.id],
    );
    return result.rows;
  }

  const result = await db.query(
    `select o.id, o.slug, o.name, o.organization_type as "organizationType",
            o.city, o.state, pol.status
       from app.patient_organization_links pol
       join app.organizations o on o.id = pol.organization_id
      where pol.patient_profile_id = $1
        and pol.status = 'active'
      order by o.name`,
    [profile.id],
  );
  return result.rows;
}

export async function onboardProfile({
  authUser,
  accountType,
  organizationSlug,
}: {
  authUser: { id: string; email: string; name?: string | null };
  accountType: PortalAccountType;
  organizationSlug?: string | null;
}) {
  const existing = await resolveProfile(authUser);
  if (existing) return existing;

  const client = await db.connect();
  try {
    await client.query('begin');

    if (accountType === 'patient') {
      const inserted = await client.query<ProfileRow>(
        `insert into app.profiles
          (auth_user_id, account_type, status, display_name, preferred_language)
         values ($1, 'patient', 'active', $2, 'es')
         returning id, auth_user_id, account_type, status, display_name, preferred_language, demo_email`,
        [authUser.id, authUser.name?.trim() || authUser.email],
      );
      await client.query('commit');
      return toProfile(inserted.rows[0]);
    }

    if (!organizationSlug) throw new Error('organization_required');

    const organization = await client.query<{ id: string }>(
      'select id from app.organizations where slug = $1 limit 1',
      [organizationSlug],
    );
    if (!organization.rows[0]) throw new Error('organization_not_found');

    const inserted = await client.query<ProfileRow>(
      `insert into app.profiles
        (auth_user_id, account_type, status, display_name, preferred_language)
       values ($1, 'provider', 'pending', $2, 'en')
       returning id, auth_user_id, account_type, status, display_name, preferred_language, demo_email`,
      [authUser.id, authUser.name?.trim() || authUser.email],
    );

    await client.query(
      `insert into app.provider_memberships
        (provider_profile_id, organization_id, membership_role, status)
       values ($1, $2, 'staff', 'pending')`,
      [inserted.rows[0].id, organization.rows[0].id],
    );

    await client.query('commit');
    return toProfile(inserted.rows[0]);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}
