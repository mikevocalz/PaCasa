-- Pa'Casa Supabase bootstrap.
-- Supabase is the PostgreSQL host only. Authentication is Better Auth.
-- Do NOT place Better Auth tables in Supabase's reserved auth schema.

create extension if not exists pgcrypto;
create schema if not exists better_auth;
create schema if not exists app;

-- Keep both schemas server-only unless a future migration deliberately exposes them.
revoke all on schema better_auth from anon, authenticated;
revoke all on schema app from anon, authenticated;

do $$ begin
  create type app.account_type as enum ('patient', 'provider');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app.profile_status as enum ('active', 'pending', 'disabled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app.provider_membership_role as enum ('clinician', 'staff', 'admin');
exception when duplicate_object then null; end $$;

create table if not exists app.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  organization_type text not null check (organization_type in ('clinic', 'health_center', 'hospital')),
  city text not null,
  state text not null default 'NY',
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists app.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id text not null unique,
  account_type app.account_type not null,
  status app.profile_status not null default 'active',
  display_name text not null,
  preferred_language text not null default 'es',
  demo_email text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.provider_memberships (
  id uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null references app.profiles(id) on delete cascade,
  organization_id uuid not null references app.organizations(id) on delete cascade,
  membership_role app.provider_membership_role not null default 'staff',
  status app.profile_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (provider_profile_id, organization_id)
);

create table if not exists app.patient_organization_links (
  id uuid primary key default gen_random_uuid(),
  patient_profile_id uuid not null references app.profiles(id) on delete cascade,
  organization_id uuid not null references app.organizations(id) on delete cascade,
  status app.profile_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (patient_profile_id, organization_id)
);

create index if not exists provider_memberships_org_idx on app.provider_memberships (organization_id, status);
create index if not exists patient_org_links_org_idx on app.patient_organization_links (organization_id, status);
create index if not exists profiles_account_status_idx on app.profiles (account_type, status);

-- Defense in depth. The app schema is not part of Supabase's exposed schemas.
alter table app.organizations enable row level security;
alter table app.profiles enable row level security;
alter table app.provider_memberships enable row level security;
alter table app.patient_organization_links enable row level security;

revoke all on all tables in schema app from anon, authenticated;
revoke all on all sequences in schema app from anon, authenticated;
