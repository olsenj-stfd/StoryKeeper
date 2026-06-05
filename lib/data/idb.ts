'use client';

import type {
  Story,
  StoryNode,
  Session,
  StoryBible,
  World,
  CoverHue,
} from '../types';
import type { DataAdapter } from './types';
import {
  SEED_NODES,
  SEED_STORY,
  SEED_WORLD,
  DEFAULT_STORY_ID,
  DEFAULT_FAMILY_ID,
} from '../seed';

const DB_NAME = 'storykeeper';
const DB_VERSION = 2;
const EVENT = 'storykeeper:update';
const ALL_EVENT = 'storykeeper:any';

const STORES = {
  worlds: 'worlds',
  stories: 'stories',
  nodes: 'nodes',
  sessions: 'sessions',
  audio: 'audio',
  bibles: 'bibles',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      // Clean migration for prototype: drop everything, recreate.
      for (const name of Array.from(db.objectStoreNames)) {
        db.deleteObjectStore(name);
      }
      db.createObjectStore(STORES.worlds, { keyPath: 'id' });
      const stories = db.createObjectStore(STORES.stories, { keyPath: 'id' });
      stories.createIndex('worldId', 'worldId', { unique: false });
      const nodes = db.createObjectStore(STORES.nodes, { keyPath: 'id' });
      nodes.createIndex('storyId', 'storyId', { unique: false });
      db.createObjectStore(STORES.sessions, { keyPath: 'storyId' });
      db.createObjectStore(STORES.audio);
      db.createObjectStore(STORES.bibles, { keyPath: 'storyId' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function get<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function put<T>(store: string, value: T, key?: IDBValidKey): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const s = db.transaction(store, 'readwrite').objectStore(store);
    const req = key !== undefined ? s.put(value, key) : s.put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function del(store: string, key: IDBValidKey): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getAll<T>(store: string): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

async function getAllByIndex<T>(
  store: string,
  indexName: string,
  key: IDBValidKey,
): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(store, 'readonly')
      .objectStore(store)
      .index(indexName)
      .getAll(key);
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

let seeded = false;
async function ensureSeed() {
  if (seeded) return;
  seeded = true;
  const existingWorld = await get<World>(STORES.worlds, SEED_WORLD.id);
  if (!existingWorld) await put(STORES.worlds, SEED_WORLD);
  const existingStory = await get<Story>(STORES.stories, SEED_STORY.id);
  if (!existingStory) await put(STORES.stories, SEED_STORY);
  const nodes = await getAllByIndex<StoryNode>(
    STORES.nodes,
    'storyId',
    DEFAULT_STORY_ID,
  );
  if (nodes.length === 0) {
    for (const n of SEED_NODES) await put(STORES.nodes, n);
  }
}

const audioUrlCache = new Map<string, string>();

function urlFor(id: string, blob: Blob): string {
  const cached = audioUrlCache.get(id);
  if (cached) return cached;
  const url = URL.createObjectURL(blob);
  audioUrlCache.set(id, url);
  return url;
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

const HUES: CoverHue[] = ['kid', 'parent', 'mint', 'coral'];

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const idbAdapter: DataAdapter = {
  async listWorlds() {
    if (typeof window === 'undefined') return [];
    await ensureSeed();
    const ws = await getAll<World>(STORES.worlds);
    ws.sort((a, b) => a.createdAt - b.createdAt);
    return ws;
  },

  async createWorld({ name, description, coverHue }) {
    const world: World = {
      id: newId('w'),
      name,
      description: description ?? null,
      familyId: DEFAULT_FAMILY_ID,
      coverHue: coverHue ?? HUES[Math.floor(Math.random() * HUES.length)],
      createdAt: Date.now(),
    };
    await put(STORES.worlds, world);
    notifyAll();
    return world;
  },

  async getStory(storyId) {
    if (typeof window === 'undefined') return null;
    await ensureSeed();
    return (await get<Story>(STORES.stories, storyId)) ?? null;
  },

  async listStoriesByWorld(worldId) {
    if (typeof window === 'undefined') return [];
    await ensureSeed();
    const stories = await getAllByIndex<Story>(STORES.stories, 'worldId', worldId);
    stories.sort((a, b) => a.createdAt - b.createdAt);
    return stories;
  },

  async createStory({ worldId, title }) {
    const story: Story = {
      id: newId('s'),
      worldId,
      title,
      familyId: DEFAULT_FAMILY_ID,
      createdAt: Date.now(),
    };
    await put(STORES.stories, story);
    notifyAll();
    return story;
  },

  async updateStory(storyId, patch) {
    const existing = await get<Story>(STORES.stories, storyId);
    if (!existing) return;
    const updated: Story = {
      ...existing,
      ...(patch.title !== undefined ? { title: patch.title } : {}),
    };
    await put(STORES.stories, updated);
    notify(storyId);
    notifyAll();
  },

  async deleteStory(storyId) {
    // Cascade delete everything tied to this story: nodes, their audio
    // blobs, cached object URLs, the kid's session, and the story bible.
    const nodes = await getAllByIndex<StoryNode>(STORES.nodes, 'storyId', storyId);
    for (const n of nodes) {
      await del(STORES.nodes, n.id);
      await del(STORES.audio, n.id);
      const url = audioUrlCache.get(n.id);
      if (url) {
        URL.revokeObjectURL(url);
        audioUrlCache.delete(n.id);
      }
    }
    await del(STORES.sessions, storyId);
    await del(STORES.bibles, storyId);
    await del(STORES.stories, storyId);
    notify(storyId);
    notifyAll();
  },

  async listNodes(storyId) {
    if (typeof window === 'undefined') return [];
    await ensureSeed();
    const nodes = await getAllByIndex<StoryNode>(STORES.nodes, 'storyId', storyId);
    nodes.sort((a, b) => a.createdAt - b.createdAt);
    for (const n of nodes) {
      if (n.audioUrl) continue;
      const blob = await get<Blob>(STORES.audio, n.id);
      if (blob) n.audioUrl = urlFor(n.id, blob);
    }
    return nodes;
  },

  async updateNode(nodeId, patch) {
    const existing = await get<StoryNode>(STORES.nodes, nodeId);
    if (!existing) return;
    const updated: StoryNode = {
      ...existing,
      ...(patch.branchLabel !== undefined ? { branchLabel: patch.branchLabel } : {}),
      ...(patch.text !== undefined ? { text: patch.text } : {}),
      ...(patch.branchIcon !== undefined ? { branchIcon: patch.branchIcon } : {}),
    };
    await put(STORES.nodes, updated);
    notify(existing.storyId);
    notifyAll();
  },

  async fulfillKidRequest(nodeId, audioBlob, who, text) {
    const existing = await get<StoryNode>(STORES.nodes, nodeId);
    if (!existing) return;
    await put(STORES.audio, audioBlob, nodeId);
    const url = urlFor(nodeId, audioBlob);
    const updated: StoryNode = {
      ...existing,
      who,
      audioUrl: url,
      ...(text !== undefined && text.trim() ? { text } : {}),
    };
    await put(STORES.nodes, updated);
    notify(existing.storyId);
    notifyAll();
  },

  async appendNode(input, audioBlob) {
    const id = newId('n');
    const node: StoryNode = {
      ...input,
      id,
      audioUrl: null,
      createdAt: Date.now(),
    };
    await put(STORES.nodes, node);
    if (audioBlob) {
      await put(STORES.audio, audioBlob, id);
      node.audioUrl = urlFor(id, audioBlob);
    }
    notify(node.storyId);
    return node;
  },

  async getSession(storyId) {
    if (typeof window === 'undefined') return null;
    return (await get<Session>(STORES.sessions, storyId)) ?? null;
  },

  async setSession(session) {
    await put(STORES.sessions, session);
    notify(session.storyId);
  },

  subscribe(storyId, callback) {
    if (typeof window === 'undefined') return () => {};
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail === storyId) callback();
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  },

  subscribeAll(callback) {
    if (typeof window === 'undefined') return () => {};
    const handler = () => callback();
    window.addEventListener(ALL_EVENT, handler);
    return () => window.removeEventListener(ALL_EVENT, handler);
  },

  async resetStory(storyId) {
    const nodes = await getAllByIndex<StoryNode>(STORES.nodes, 'storyId', storyId);
    for (const n of nodes) {
      // Skip seed nodes
      if (n.id === 'seed-1') continue;
      await del(STORES.nodes, n.id);
      await del(STORES.audio, n.id);
      const url = audioUrlCache.get(n.id);
      if (url) {
        URL.revokeObjectURL(url);
        audioUrlCache.delete(n.id);
      }
    }
    await del(STORES.sessions, storyId);
    notify(storyId);
  },

  async getStoryBible(storyId) {
    if (typeof window === 'undefined') return null;
    return (await get<StoryBible>(STORES.bibles, storyId)) ?? null;
  },

  async setStoryBible(bible) {
    await put(STORES.bibles, bible);
    notify(bible.storyId);
  },
};
