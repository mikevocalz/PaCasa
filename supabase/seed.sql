-- Pa'Casa demo fixtures. All people and organizations below are fictional.
-- These auth_user_id values match the local Base44/Vite demo sessions.
-- When Better Auth is attached, seed the corresponding Better Auth users and
-- reconcile auth_user_id to the real Better Auth user IDs.

insert into app.organizations (id, slug, name, organization_type, city, state, is_demo)
values
  ('11111111-1111-4111-8111-111111111111', 'clinica-san-miguel', 'Clínica San Miguel', 'clinic', 'Bronx', 'NY', true),
  ('22222222-2222-4222-8222-222222222222', 'centro-esperanza', 'Centro de Salud Esperanza', 'health_center', 'Washington Heights', 'NY', true),
  ('33333333-3333-4333-8333-333333333333', 'hospital-la-familia', 'Hospital Comunitario La Familia', 'hospital', 'East Harlem', 'NY', true)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  organization_type = excluded.organization_type,
  city = excluded.city,
  state = excluded.state,
  is_demo = true;

insert into app.profiles (id, auth_user_id, account_type, status, display_name, preferred_language, demo_email, is_demo)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'demo-patient-rosa', 'patient', 'active', 'Rosa Velázquez', 'es', 'rosa.patient@demo.pacasa.test', true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'demo-patient-elena', 'patient', 'active', 'Elena Martínez', 'es', 'elena.patient@demo.pacasa.test', true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'demo-patient-carlos', 'patient', 'active', 'Carlos Rivera', 'es', 'carlos.patient@demo.pacasa.test', true),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'demo-provider-elena', 'provider', 'active', 'Dra. Elena Ruiz', 'en', 'elena.ruiz@demo.pacasa.test', true),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'demo-provider-ana', 'provider', 'active', 'Ana Morales', 'es', 'ana.morales@demo.pacasa.test', true),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', 'demo-provider-luis', 'provider', 'active', 'Dr. Luis Torres', 'en', 'luis.torres@demo.pacasa.test', true)
on conflict (id) do update set
  display_name = excluded.display_name,
  preferred_language = excluded.preferred_language,
  demo_email = excluded.demo_email,
  is_demo = true;

insert into app.provider_memberships (provider_profile_id, organization_id, membership_role, status)
values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', '11111111-1111-4111-8111-111111111111', 'clinician', 'active'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', '22222222-2222-4222-8222-222222222222', 'staff', 'active'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', '33333333-3333-4333-8333-333333333333', 'clinician', 'active')
on conflict (provider_profile_id, organization_id) do update set
  membership_role = excluded.membership_role,
  status = 'active';

insert into app.patient_organization_links (patient_profile_id, organization_id, status)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '11111111-1111-4111-8111-111111111111', 'active'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '22222222-2222-4222-8222-222222222222', 'active'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', '33333333-3333-4333-8333-333333333333', 'active')
on conflict (patient_profile_id, organization_id) do update set status = 'active';
