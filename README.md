# StoryKeeper

A storytelling app for kids whose parents work away from home — military, pilots,
consultants. Parents record story segments and branch options; kids pick up
where they left off, hear their parent's voice, and choose what happens next.

The parent's voice is sacred — kids only ever hear the real recording. AI lives
on the parent's side only (suggests branches, will later recap "where did we
leave off"). Never speaks to the kid.

## Run locally

    npm run dev

http://localhost:3001. No keys needed — data persists in browser localStorage,
AI suggestions come from a curated pool.

## Deploy

Drop these into `.env.local`:

    NEXT_PUBLIC_SUPABASE_URL=…
    NEXT_PUBLIC_SUPABASE_ANON_KEY=…
    ANTHROPIC_API_KEY=…

Run `supabase/migrations/0001_init.sql` against your Supabase project. Create
a Storage bucket named `story-audio` (public read) for parent recordings.

## Layout

- `app/` — Next.js App Router. `/` is the Kid/Parent picker;
  `/kid/[storyId]` is the read-along view; `/parent/[storyId]` is the
  recording editor; `/api/ai/branches` returns branch suggestions.
- `lib/data/` — data adapter. `local.ts` is the localStorage impl used
  today; `supabase.ts` is a stub for when keys are added.
- `lib/seed.ts` — the Garden story seed.
- `lib/branches.ts` — curated branch pool (AI fallback).
- `components/` — `Bubble`, `RecordButton`, `BranchPicker`.
- `supabase/migrations/` — schema for cloud sync.
- `_mvp/` — original 10-min single-HTML prototype, kept for reference.
