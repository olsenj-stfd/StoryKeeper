'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  CoverHue,
  Session,
  Story,
  StoryBible,
  StoryNode,
  World,
} from '../types';
import type { DataAdapter } from './types';
import {
  DEFAULT_FAMILY_ID,
  DEFAULT_STORY_ID,
  SEED_NODES,
  SEED_STORY,
  SEED_WORLD,
} from '../seed';

const URL_ENV = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY_ENV = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BUCKET = 'story-audio';
const HUES: CoverHue[] = ['kid', 'parent', 'mint', 'coral'];

const EVENT = 'storykeeper:update';
const ALL_EVENT = 'storykeeper:any';

let client: SupabaseClient | null = null;
function db(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (!URL_ENV || !KEY_ENV) return null;
  if (!client) {
    client = createClient(URL_ENV, KEY_ENV, {
      realtime: { params: { eventsPerSecond: 10 } },
    });
    bootstrapRealtime(client);
  }
  return client;
}

function notify(storyId: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: storyId }));
  window.dispatchEvent(new CustomEvent(ALL_EVENT));
}
function notifyAll() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ALL_EVENT));
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---- Row <-> object converters ----

type WorldRow = {
  id: string;
  family_id: string;
  name: string;
  description: string | null;
  cover_hue: CoverHue;
  created_at: string;
};
function worldFromRow(r: WorldRow): World {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    familyId: r.family_id,
    coverHue: (r.cover_hue ?? 'mint') as CoverHue,
    createdAt: r.created_at ? new Date(r.created_at).getTime() : 0,
  };
}

type StoryRow = {
  id: string;
  family_id: string;
  world_id: string;
  title: string;
  created_at: string;
};
function storyFromRow(r: StoryRow): Story {
  return {
    id: r.id,
    worldId: r.world_id,
    title: r.title ?? '',
    familyId: r.family_id,
    createdAt: r.created_at ? new Date(r.created_at).getTime() : 0,
  };
}

type NodeRow = {
  id: string;
  story_id: string;
  parent_node_id: string | null;
  type: 'voice' | 'prompt' | 'kid_text';
  who: string;
  text: string | null;
  audio_url: string | null;
  branch_label: string | null;
  branch_icon: string | null;
  order_index: number;
  created_at: string;
};
function nodeFromRow(r: NodeRow): StoryNode {
  return {
    id: r.id,
    storyId: r.story_id,
    parentNodeId: r.parent_node_id,
    type: r.type,
    who: r.who,
    text: r.text,
    audioUrl: r.audio_url,
    branchLabel: r.branch_label,
    branchIcon: r.branch_icon,
    orderIndex: r.order_index,
    createdAt: r.created_at ? new Date(r.created_at).getTime() : 0,
  };
}

type SessionRow = {
  story_id: string;
  current_node_id: string | null;
  updated_at: string;
};
function sessionFromRow(r: SessionRow): Session {
  return {
    storyId: r.story_id,
    currentNodeId: r.current_node_id,
    updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : 0,
  };
}

type BibleRow = {
  story_id: string;
  synopsis: string | null;
  characters: StoryBible['characters'];
  themes: string[];
  settings: string[];
  source: string | null;
  updated_at: string;
};
function bibleFromRow(r: BibleRow): StoryBible {
  return {
    storyId: r.story_id,
    synopsis: r.synopsis ?? '',
    characters: r.characters ?? [],
    themes: r.themes ?? [],
    settings: r.settings ?? [],
    source: r.source ?? undefined,
    updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : 0,
  };
}

// ---- Seed (one-time per family) ----

let seedPromise: Promise<void> | null = null;
async function ensureSeed(c: SupabaseClient) {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    // Family
    await c
      .from('families')
      .upsert({ id: DEFAULT_FAMILY_ID, name: 'Default family' });
    // Seed world
    const { data: existingWorld } = await c
      .from('worlds')
      .select('id')
      .eq('id', SEED_WORLD.id)
      .maybeSingle();
    if (!existingWorld) {
      await c.from('worlds').insert({
        id: SEED_WORLD.id,
        family_id: SEED_WORLD.familyId,
        name: SEED_WORLD.name,
        description: SEED_WORLD.description,
        cover_hue: SEED_WORLD.coverHue,
      });
    }
    // Seed story
    const { data: existingStory } = await c
      .from('stories')
      .select('id')
      .eq('id', SEED_STORY.id)
      .maybeSingle();
    if (!existingStory) {
      await c.from('stories').insert({
        id: SEED_STORY.id,
        family_id: SEED_STORY.familyId,
        world_id: SEED_STORY.worldId,
        title: SEED_STORY.title,
      });
    }
    // Seed nodes
    const { data: existingNodes } = await c
      .from('nodes')
      .select('id')
      .eq('story_id', DEFAULT_STORY_ID);
    if (!existingNodes || existingNodes.length === 0) {
      for (const n of SEED_NODES) {
        await c.from('nodes').insert({
          id: n.id,
          story_id: n.storyId,
          parent_node_id: n.parentNodeId,
          type: n.type,
          who: n.who,
          text: n.text,
          audio_url: n.audioUrl,
          branch_label: n.branchLabel,
          branch_icon: n.branchIcon,
          order_index: n.orderIndex,
        });
      }
    }
  })();
  return seedPromise;
}

// ---- Realtime: subscribe once to any change and broadcast a window event ----

let realtimeBootstrapped = false;
function bootstrapRealtime(c: SupabaseClient) {
  if (realtimeBootstrapped) return;
  realtimeBootstrapped = true;
  c.channel('app-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'nodes' },
      (payload) => {
        const sid =
          (payload.new as { story_id?: string } | null)?.story_id ??
          (payload.old as { story_id?: string } | null)?.story_id;
        if (sid) notify(sid);
        else notifyAll();
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sessions' },
      (payload) => {
        const sid =
          (payload.new as { story_id?: string } | null)?.story_id ??
          (payload.old as { story_id?: string } | null)?.story_id;
        if (sid) notify(sid);
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'story_bibles' },
      (payload) => {
        const sid =
          (payload.new as { story_id?: string } | null)?.story_id ??
          (payload.old as { story_id?: string } | null)?.story_id;
        if (sid) notify(sid);
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'stories' },
      () => notifyAll(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'worlds' },
      () => notifyAll(),
    )
    .subscribe();
}

// ---- Adapter ----

function makeAdapter(): DataAdapter {
  return {
    async listWorlds() {
      const c = db();
      if (!c) return [];
      await ensureSeed(c);
      const { data: rows } = await c
        .from('worlds')
        .select('*')
        .order('created_at', { ascending: true });
      return ((rows as WorldRow[]) ?? []).map(worldFromRow);
    },

    async createWorld({ name, description, coverHue }) {
      const c = db();
      if (!c) throw new Error('Supabase not configured');
      const world: World = {
        id: newId('w'),
        name,
        description: description ?? null,
        familyId: DEFAULT_FAMILY_ID,
        coverHue: coverHue ?? HUES[Math.floor(Math.random() * HUES.length)],
        createdAt: Date.now(),
      };
      await c.from('worlds').insert({
        id: world.id,
        family_id: world.familyId,
        name: world.name,
        description: world.description,
        cover_hue: world.coverHue,
      });
      notifyAll();
      return world;
    },

    async getStory(storyId) {
      const c = db();
      if (!c) return null;
      await ensureSeed(c);
      const { data } = await c
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .maybeSingle();
      return data ? storyFromRow(data as StoryRow) : null;
    },

    async listStoriesByWorld(worldId) {
      const c = db();
      if (!c) return [];
      await ensureSeed(c);
      const { data } = await c
        .from('stories')
        .select('*')
        .eq('world_id', worldId)
        .order('created_at', { ascending: true });
      return ((data as StoryRow[]) ?? []).map(storyFromRow);
    },

    async createStory({ worldId, title }) {
      const c = db();
      if (!c) throw new Error('Supabase not configured');
      const story: Story = {
        id: newId('s'),
        worldId,
        title,
        familyId: DEFAULT_FAMILY_ID,
        createdAt: Date.now(),
      };
      await c.from('stories').insert({
        id: story.id,
        family_id: story.familyId,
        world_id: story.worldId,
        title: story.title,
      });
      notifyAll();
      return story;
    },

    async updateStory(storyId, patch) {
      const c = db();
      if (!c) return;
      const update: Record<string, unknown> = {};
      if (patch.title !== undefined) update.title = patch.title;
      if (Object.keys(update).length === 0) return;
      await c.from('stories').update(update).eq('id', storyId);
      notify(storyId);
      notifyAll();
    },

    async deleteStory(storyId) {
      const c = db();
      if (!c) return;
      // Cascade is set on FKs — deleting the story removes nodes, session, bible.
      await c.from('stories').delete().eq('id', storyId);
      // Also try to clean up audio files in storage.
      try {
        const { data: files } = await c.storage
          .from(BUCKET)
          .list(`${DEFAULT_FAMILY_ID}/${storyId}`);
        if (files && files.length > 0) {
          const paths = files.map(
            (f) => `${DEFAULT_FAMILY_ID}/${storyId}/${f.name}`,
          );
          await c.storage.from(BUCKET).remove(paths);
        }
      } catch {
        /* ignore */
      }
      notify(storyId);
      notifyAll();
    },

    async listNodes(storyId) {
      const c = db();
      if (!c) return [];
      await ensureSeed(c);
      const { data } = await c
        .from('nodes')
        .select('*')
        .eq('story_id', storyId)
        .order('created_at', { ascending: true });
      return ((data as NodeRow[]) ?? []).map(nodeFromRow);
    },

    async appendNode(input, audioBlob) {
      const c = db();
      if (!c) throw new Error('Supabase not configured');
      const id = newId('n');
      let audioUrl: string | null = null;
      if (audioBlob) {
        const ext = (audioBlob.type.split('/')[1] ?? 'webm').split(';')[0];
        const path = `${DEFAULT_FAMILY_ID}/${input.storyId}/${id}.${ext}`;
        const { error: upErr } = await c.storage
          .from(BUCKET)
          .upload(path, audioBlob, {
            contentType: audioBlob.type,
            upsert: false,
          });
        if (!upErr) {
          const { data: urlData } = c.storage.from(BUCKET).getPublicUrl(path);
          audioUrl = urlData.publicUrl;
        }
      }
      const row = {
        id,
        story_id: input.storyId,
        parent_node_id: input.parentNodeId,
        type: input.type,
        who: input.who,
        text: input.text,
        audio_url: audioUrl,
        branch_label: input.branchLabel,
        branch_icon: input.branchIcon,
        order_index: input.orderIndex,
      };
      await c.from('nodes').insert(row);
      notify(input.storyId);
      return {
        ...input,
        id,
        audioUrl,
        createdAt: Date.now(),
      };
    },

    async updateNode(nodeId, patch) {
      const c = db();
      if (!c) return;
      const update: Record<string, unknown> = {};
      if (patch.branchLabel !== undefined) update.branch_label = patch.branchLabel;
      if (patch.text !== undefined) update.text = patch.text;
      if (patch.branchIcon !== undefined) update.branch_icon = patch.branchIcon;
      if (Object.keys(update).length === 0) return;
      // Need story_id for notify — fetch it first.
      const { data: existing } = await c
        .from('nodes')
        .select('story_id')
        .eq('id', nodeId)
        .maybeSingle();
      await c.from('nodes').update(update).eq('id', nodeId);
      const sid = (existing as { story_id?: string } | null)?.story_id;
      if (sid) notify(sid);
    },

    async getSession(storyId) {
      const c = db();
      if (!c) return null;
      const { data } = await c
        .from('sessions')
        .select('*')
        .eq('story_id', storyId)
        .maybeSingle();
      return data ? sessionFromRow(data as SessionRow) : null;
    },

    async setSession(session) {
      const c = db();
      if (!c) return;
      await c.from('sessions').upsert({
        story_id: session.storyId,
        current_node_id: session.currentNodeId,
        updated_at: new Date(session.updatedAt).toISOString(),
      });
      notify(session.storyId);
    },

    subscribe(storyId, callback) {
      if (typeof window === 'undefined') return () => {};
      // Lazy: ensure realtime is bootstrapped by touching the client.
      db();
      const handler = (e: Event) => {
        if ((e as CustomEvent).detail === storyId) callback();
      };
      window.addEventListener(EVENT, handler);
      return () => window.removeEventListener(EVENT, handler);
    },

    subscribeAll(callback) {
      if (typeof window === 'undefined') return () => {};
      db();
      const handler = () => callback();
      window.addEventListener(ALL_EVENT, handler);
      return () => window.removeEventListener(ALL_EVENT, handler);
    },

    async resetStory(storyId) {
      const c = db();
      if (!c) return;
      const { data: rows } = await c
        .from('nodes')
        .select('id')
        .eq('story_id', storyId)
        .neq('id', 'seed-1');
      if (rows && rows.length > 0) {
        const ids = rows.map((r) => (r as { id: string }).id);
        await c.from('nodes').delete().in('id', ids);
      }
      await c.from('sessions').delete().eq('story_id', storyId);
      notify(storyId);
    },

    async getStoryBible(storyId) {
      const c = db();
      if (!c) return null;
      const { data } = await c
        .from('story_bibles')
        .select('*')
        .eq('story_id', storyId)
        .maybeSingle();
      return data ? bibleFromRow(data as BibleRow) : null;
    },

    async setStoryBible(bible) {
      const c = db();
      if (!c) return;
      await c.from('story_bibles').upsert({
        story_id: bible.storyId,
        synopsis: bible.synopsis,
        characters: bible.characters,
        themes: bible.themes,
        settings: bible.settings,
        source: bible.source ?? null,
        updated_at: new Date(bible.updatedAt).toISOString(),
      });
      notify(bible.storyId);
    },
  };
}

// Only build the adapter when env vars are present — otherwise stays null so
// lib/data/index.ts falls back to the IDB adapter (local-only).
export const supabaseAdapter: DataAdapter | null =
  URL_ENV && KEY_ENV ? makeAdapter() : null;
