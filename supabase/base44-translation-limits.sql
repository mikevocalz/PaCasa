-- Run after bootstrap.sql. Private, text-free per-account demo translation quota.
-- The application never applies schema changes during a request.
create table if not exists app.translation_limits (
  auth_user_id text primary key,
  window_started timestamptz not null,
  request_count integer not null check (request_count > 0 and request_count <= 20)
);
alter table app.translation_limits enable row level security;
revoke all on app.translation_limits from public, anon, authenticated;
