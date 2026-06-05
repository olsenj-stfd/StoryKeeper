'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { data } from '@/lib/data';
import type { Story, World } from '@/lib/types';
import { useModeLabels } from '@/lib/mode';
import { RecordButton } from '@/components/RecordButton';
import { StorytellerChips } from '@/components/StorytellerChips';
import { RecentActivity } from '@/components/RecentActivity';
import { ListenerRequests } from '@/components/ListenerRequests';
import { AuthGate } from '@/components/AuthGate';
import { indexStoryNow } from '@/lib/indexing';

const HUE_MARKER: Record<string, string> = {
  kid: 'marker-kid',
  parent: 'marker-parent',
  mint: 'marker-mint',
  coral: 'marker-coral',
};

export default function ParentLibraryRoute() {
  return (
    <AuthGate>
      <ParentLibrary />
    </AuthGate>
  );
}

function ParentLibrary() {
  const router = useRouter();
  const labels = useModeLabels();
  const [worlds, setWorlds] = useState<World[]>([]);
  const [storiesByWorld, setStoriesByWorld] = useState<Record<string, Story[]>>({});
  const [newWorldName, setNewWorldName] = useState('');
  const [creatingWorld, setCreatingWorld] = useState(false);

  // Quick-record state
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickWho, setQuickWho] = useState('Mom');
  const [quickRouting, setQuickRouting] = useState(false);
  const [quickStatus, setQuickStatus] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const ws = await data.listWorlds();
    setWorlds(ws);
    const map: Record<string, Story[]> = {};
    for (const w of ws) map[w.id] = await data.listStoriesByWorld(w.id);
    setStoriesByWorld(map);
  }, []);

  useEffect(() => {
    refresh();
    const unsub = data.subscribeAll(refresh);
    return unsub;
  }, [refresh]);

  const addWorld = async () => {
    if (!newWorldName.trim()) return;
    await data.createWorld({ name: newWorldName.trim() });
    setNewWorldName('');
    setCreatingWorld(false);
  };

  const recordNewStory = async (worldId: string) => {
    const story = await data.createStory({ worldId, title: '' });
    router.push(`/parent/${story.id}`);
  };

  async function autoTitleStory(storyId: string, transcript: string) {
    try {
      const r = await fetch('/api/ai/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      const j = (await r.json()) as { title?: string };
      const title = (j.title ?? '').trim();
      if (title) await data.updateStory(storyId, { title });
    } catch {
      /* leave title blank — parent can name it manually */
    }
  }

  const deleteStory = async (storyId: string, title: string) => {
    const label = title.trim() || 'this untitled story';
    if (!confirm(`Delete "${label}" forever? This can't be undone.`)) return;
    await data.deleteStory(storyId);
  };

  // The "Record Your Story" frictionless flow: parent records, AI picks
  // which world it belongs to (or creates a new one), parent lands in
  // the editor where they can adjust.
  const onQuickRecorded = async (blob: Blob, transcript: string) => {
    setQuickRouting(true);
    setQuickStatus('Routing your story…');
    try {
      const ws = await data.listWorlds();
      const sourceText =
        transcript.trim() || `(${quickWho} recorded a new story.)`;

      let targetWorldId: string | null = null;
      try {
        const routeResp = await fetch('/api/ai/route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: sourceText,
            worlds: ws.map((w) => ({
              id: w.id,
              name: w.name,
              description: w.description,
            })),
          }),
        });
        const route = (await routeResp.json()) as {
          worldId?: string | null;
          suggestedNewWorldName?: string;
        };

        if (route.worldId && ws.some((w) => w.id === route.worldId)) {
          targetWorldId = route.worldId;
        } else if (route.suggestedNewWorldName) {
          setQuickStatus(`Starting a new world: "${route.suggestedNewWorldName}"…`);
          const newWorld = await data.createWorld({
            name: route.suggestedNewWorldName,
          });
          targetWorldId = newWorld.id;
        }
      } catch {
        /* AI route failed — fall through to the fallback below */
      }

      if (!targetWorldId) {
        targetWorldId =
          ws[0]?.id ?? (await data.createWorld({ name: 'New stories' })).id;
      }

      // Create the story and save the recording as its first node.
      const story = await data.createStory({ worldId: targetWorldId, title: '' });
      await data.appendNode(
        {
          storyId: story.id,
          parentNodeId: null,
          type: 'voice',
          who: quickWho,
          text: sourceText,
          branchLabel: null,
          branchIcon: null,
          orderIndex: 0,
        },
        blob,
      );
      // Fire-and-forget indexing + auto-titling.
      void indexStoryNow(story.id);
      void autoTitleStory(story.id, sourceText);

      setQuickOpen(false);
      setQuickStatus(null);
      router.push(`/parent/${story.id}`);
    } finally {
      setQuickRouting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 paper-grid px-5 py-6">
      <header className="flex justify-between items-end mb-6 max-w-2xl w-full mx-auto pb-3 border-b border-dashed border-ink/30">
        <div>
          <div className="annotation">
            {labels.brand.toUpperCase()} &middot; {labels.storytellerUpper}{' '}
            &middot; LIBRARY
          </div>
          <div className="font-display text-2xl mt-1">
            <span className="marker-highlight">
              {labels.libraryLabel.split(' ')[0].toUpperCase()}
            </span>{' '}
            {labels.libraryLabel.split(' ').slice(1).join(' ').toUpperCase()}
          </div>
        </div>
        <Link href="/" className="annotation hover:text-ink">
          &larr; SWITCH
        </Link>
      </header>

      <div className="max-w-2xl w-full mx-auto flex flex-col gap-6">
        {/* Frictionless record */}
        <section className="sketched-box marker-coral p-5 relative">
          <div className="annotation absolute -top-4 left-5">QUICK RECORD</div>
          {!quickOpen ? (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="font-display text-xl">
                  Just <span className="marker-highlight">tell a story</span>.
                </div>
                <div className="text-sm font-bold mt-1">
                  AI figures out which world it belongs to.
                </div>
              </div>
              <button
                onClick={() => setQuickOpen(true)}
                type="button"
                className="sketched-btn marker-kid text-lg"
              >
                🎙️ RECORD YOUR STORY
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <StorytellerChips value={quickWho} onChange={setQuickWho} />
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <div className="text-sm">
                  When you stop, we&rsquo;ll route your story to the right
                  world and open the editor.
                </div>
                <RecordButton onRecorded={onQuickRecorded} />
              </div>
              {quickStatus && (
                <div className="annotation ink">{quickStatus}</div>
              )}
              {quickRouting && !quickStatus && (
                <div className="annotation">Saving…</div>
              )}
              <button
                onClick={() => setQuickOpen(false)}
                type="button"
                className="annotation hover:text-ink"
              >
                ← CANCEL
              </button>
            </div>
          )}
        </section>

        {/* Listener requests + activity */}
        <ListenerRequests defaultWho={quickWho} />
        <RecentActivity audience="parent" />

        {/* Worlds & explicit per-world recording */}
        <div className="flex flex-col gap-10">
          {worlds.map((w, wi) => {
            const stories = storiesByWorld[w.id] ?? [];
            return (
              <section
                key={w.id}
                className={`sketched-box ${HUE_MARKER[w.coverHue]} p-5 relative ${
                  wi % 2 === 0 ? 'self-start w-full' : 'self-end w-full'
                }`}
              >
                <div className="annotation absolute -top-4 left-5">
                  WORLD {wi + 1}
                </div>
                <div className="mb-3">
                  <div className="font-display text-xl">{w.name}</div>
                  {w.description && (
                    <div className="text-sm text-muted mt-0.5">{w.description}</div>
                  )}
                </div>

                <button
                  onClick={() => recordNewStory(w.id)}
                  type="button"
                  className="sketched-btn marker-kid mb-4"
                >
                  + RECORD NEW STORY
                </button>

                {stories.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {stories.map((s) => (
                      <div
                        key={s.id}
                        className="relative bg-white border-2 border-ink/70 rounded-lg pr-8"
                      >
                        <Link
                          href={`/parent/${s.id}`}
                          className="block px-3 py-2.5 hover:bg-cream-soft rounded-lg transition"
                        >
                          <div className="font-bold text-sm">
                            {s.title.trim() || (
                              <span className="text-muted italic">Untitled story</span>
                            )}
                          </div>
                          <div className="annotation mt-1">TAP TO EDIT &rarr;</div>
                        </Link>
                        <button
                          onClick={() => deleteStory(s.id, s.title)}
                          aria-label={`Delete ${s.title || 'untitled story'}`}
                          type="button"
                          className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center text-muted hover:text-[#c64a4a] hover:bg-[#c64a4a]/10 rounded text-sm leading-none"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          <section className="sketched-box marker-mint p-5 relative">
            <div className="annotation absolute -top-4 left-5">+ ADD A WORLD</div>
            {creatingWorld ? (
              <div className="flex gap-2 flex-wrap">
                <input
                  autoFocus
                  value={newWorldName}
                  onChange={(e) => setNewWorldName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addWorld()}
                  placeholder="World name (e.g. Astro-Dog, The Lighthouse)"
                  className="flex-1 min-w-[180px] rounded-lg border-2 border-ink/60 bg-white px-3 py-2 text-sm"
                />
                <button
                  onClick={addWorld}
                  disabled={!newWorldName.trim()}
                  className="sketched-btn marker-coral disabled:opacity-50"
                  type="button"
                >
                  CREATE
                </button>
                <button
                  onClick={() => {
                    setCreatingWorld(false);
                    setNewWorldName('');
                  }}
                  className="annotation"
                  type="button"
                >
                  CANCEL
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreatingWorld(true)}
                className="sketched-btn"
                type="button"
              >
                + NEW WORLD
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
