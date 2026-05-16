'use client';

import { data } from './data';
import type { StoryBible } from './types';

// Re-index a story end-to-end: pull every node's text, send it to the
// indexing endpoint, persist the returned bible. Safe to call after any
// new node is appended (parent recording, kid branch pick, etc.) — IDB's
// notify path will wake all subscribers so the bible pills refresh.
export async function indexStoryNow(storyId: string): Promise<StoryBible | null> {
  const nodes = await data.listNodes(storyId);
  const transcript = nodes
    .filter((n) => n.text)
    .map((n) => `${n.who}: ${n.text}`)
    .join('\n');
  try {
    const r = await fetch('/api/ai/index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyId, transcript }),
    });
    const j = (await r.json()) as StoryBible;
    await data.setStoryBible(j);
    return j;
  } catch {
    return null;
  }
}
