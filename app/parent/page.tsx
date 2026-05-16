'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { data } from '@/lib/data';
import type { Story, World } from '@/lib/types';

const HUE_MARKER: Record<string, string> = {
  kid: 'marker-kid',
  parent: 'marker-parent',
  mint: 'marker-mint',
  coral: 'marker-coral',
};

export default function ParentLibrary() {
  const router = useRouter();
  const [worlds, setWorlds] = useState<World[]>([]);
  const [storiesByWorld, setStoriesByWorld] = useState<Record<string, Story[]>>({});
  const [newWorldName, setNewWorldName] = useState('');
  const [creatingWorld, setCreatingWorld] = useState(false);

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

  return (
    <div className="flex flex-col flex-1 paper-grid px-5 py-6">
      <header className="flex justify-between items-end mb-6 max-w-2xl w-full mx-auto pb-3 border-b border-dashed border-ink/30">
        <div>
          <div className="annotation">STORYKEEPER &middot; PARENT &middot; LIBRARY</div>
          <div className="font-display text-2xl mt-1">
            <span className="marker-highlight">YOUR</span> STORIES
          </div>
        </div>
        <Link href="/" className="annotation hover:text-ink">
          &larr; SWITCH
        </Link>
      </header>

      <div className="max-w-2xl w-full mx-auto flex flex-col gap-10">
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
                  <div className="text-sm text-muted mt-0.5">
                    {w.description}
                  </div>
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
                    <Link
                      key={s.id}
                      href={`/parent/${s.id}`}
                      className="bg-white border-2 border-ink/70 rounded-lg px-3 py-2.5 hover:border-ink transition"
                    >
                      <div className="font-bold text-sm">
                        {s.title.trim() || (
                          <span className="text-muted italic">Untitled story</span>
                        )}
                      </div>
                      <div className="annotation mt-1">TAP TO EDIT &rarr;</div>
                    </Link>
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
  );
}
