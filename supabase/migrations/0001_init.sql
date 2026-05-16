create extension if not exists "pgcrypto";

create table if not exists families (
  id text primary key,
  name text,
  created_at timestamptz default now()
);

create table if not exists stories (
  id text primary key,
  family_id text references families(id) on delete cascade,
  title text not null,
  created_at timestamptz default now()
);

create table if not exists nodes (
  id text primary key,
  story_id text references stories(id) on delete cascade,
  parent_node_id text references nodes(id) on delete cascade,
  type text not null check (type in ('voice','prompt','kid_text')),
  who text not null,
  text text,
  audio_url text,
  branch_label text,
  branch_icon text,
  order_index int not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_nodes_story on nodes(story_id);
create index if not exists idx_nodes_parent on nodes(parent_node_id);

create table if not exists sessions (
  story_id text primary key references stories(id) on delete cascade,
  current_node_id text references nodes(id),
  updated_at timestamptz default now()
);

insert into families(id, name) values ('family-1', 'Default family')
  on conflict do nothing;

insert into stories(id, family_id, title)
  values ('garden', 'family-1', 'The Garden with the Purple Door')
  on conflict do nothing;

insert into nodes(id, story_id, parent_node_id, type, who, text, order_index)
values ('seed-1', 'garden', null, 'voice', 'Mom',
  'Once upon a time, there was a garden tucked behind an old stone wall. At the very back of the garden, hidden by a curtain of ivy, there was a tiny purple door — just the right size for a kid your age. Nobody knew where it went. One sunny afternoon, you decided you wanted to find out.',
  0)
  on conflict do nothing;

-- Storage: create bucket 'story-audio' (public read) via Supabase dashboard.

alter table families enable row level security;
alter table stories enable row level security;
alter table nodes enable row level security;
alter table sessions enable row level security;

-- Prototype: permissive policies for the single-family setup.
-- Tighten before going multi-family.
create policy "open-all-families" on families for all using (true) with check (true);
create policy "open-all-stories" on stories for all using (true) with check (true);
create policy "open-all-nodes" on nodes for all using (true) with check (true);
create policy "open-all-sessions" on sessions for all using (true) with check (true);
