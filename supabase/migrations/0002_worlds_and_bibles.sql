-- 0002: Worlds, story.world_id, story_bibles
-- Run this after 0001_init.sql. Idempotent (safe to re-run).

create table if not exists worlds (
  id text primary key,
  family_id text references families(id) on delete cascade,
  name text not null,
  description text,
  cover_hue text not null default 'mint',
  created_at timestamptz default now()
);

-- Seed default world if missing
insert into worlds(id, family_id, name, description, cover_hue)
values ('garden', 'family-1', 'The Garden',
  'Stories from a garden behind an old stone wall.', 'mint')
  on conflict do nothing;

-- Add world_id to stories
alter table stories add column if not exists world_id text references worlds(id) on delete cascade;

-- Backfill any existing rows to the seed world
update stories set world_id = 'garden' where world_id is null;

-- Story bibles
create table if not exists story_bibles (
  story_id text primary key references stories(id) on delete cascade,
  synopsis text,
  characters jsonb default '[]'::jsonb,
  themes jsonb default '[]'::jsonb,
  settings jsonb default '[]'::jsonb,
  source text,
  updated_at timestamptz default now()
);

-- Realtime: enable change streams for the tables the app subscribes to.
-- (Supabase enables Realtime per-table; this is the SQL equivalent.)
alter publication supabase_realtime add table worlds;
alter publication supabase_realtime add table stories;
alter publication supabase_realtime add table nodes;
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table story_bibles;

-- RLS: keep permissive for single-family prototype
alter table worlds enable row level security;
alter table story_bibles enable row level security;
create policy "open-all-worlds" on worlds for all using (true) with check (true);
create policy "open-all-bibles" on story_bibles for all using (true) with check (true);

-- Storage bucket for audio (run separately in Supabase dashboard):
--   1. Storage → New bucket → name: story-audio, public: true
--   2. Policy: allow anonymous insert + read on objects
