-- 0003: Auth-friendly schema additions.
-- Adds owner_id to families and creates memberships + invites tables.
-- Run after 0002. Safe to re-run.

-- Track which auth.users owns a family. Nullable so the existing
-- "family-1" seed row stays valid even without an owner.
alter table families add column if not exists owner_id uuid references auth.users(id) on delete set null;

-- Memberships: many users to many families with a role.
create table if not exists memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  family_id text not null references families(id) on delete cascade,
  role text not null default 'storyteller' check (role in ('owner','storyteller','listener')),
  created_at timestamptz default now(),
  primary key (user_id, family_id)
);

-- Invites that have not yet been accepted.
create table if not exists invites (
  id text primary key,
  family_id text not null references families(id) on delete cascade,
  email text not null,
  token text not null unique,
  status text not null default 'pending' check (status in ('pending','accepted','expired','canceled')),
  created_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_invites_family on invites(family_id);
create index if not exists idx_invites_email on invites(email);

alter table memberships enable row level security;
alter table invites enable row level security;

-- Permissive policies for the single-family prototype. Tighten before
-- multi-family — see comments below.
create policy "open-all-memberships" on memberships for all using (true) with check (true);
create policy "open-all-invites" on invites for all using (true) with check (true);

-- Realtime
alter publication supabase_realtime add table memberships;
alter publication supabase_realtime add table invites;

-- TODO when ready for real multi-family:
--   - Replace "open-all" policies with auth.uid()-based scoping
--     (membership rows visible only to the user; invites visible only
--     to the family owner / admins).
--   - Have the data adapter filter every query by the user's
--     active family_id (looked up via memberships).
