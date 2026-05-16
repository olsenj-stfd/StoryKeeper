'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { data } from '@/lib/data';
import type { Story, StoryBible, World } from '@/lib/types';
import { CharacterPills } from '@/components/CharacterPills';

const HUE_MARKER: Record<string, string> = {
  kid: 'marker-kid',
  parent: 'marker-parent',
  mint: 'marker-mint',
  coral: 'marker-coral',
};

export default function KidLibrary() {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [storiesByWorld, setStoriesByWorld] = useState<Record<string, Story[]>>({});
  const [bibles, setBibles] = useState<Record<string, StoryBible | null>>({});

  const refresh = useCallback(async () => {
    const ws = await data.listWorlds();
    setWorlds(ws);
    const storyMap: Record<string, Story[]> = {};
    const bibleMap: Record<string, StoryBible | null> = {};
    for (const w of ws) {
      // Hide untitled stories from the kid — they're parent works-in-progress.
      const stories = (await data.listStoriesByWorld(w.id)).filter(
        (s) => s.title.trim().length > 0,
      );
      storyMap[w.id] = stories;
      for (const s of stories) {
        bibleMap[s.id] = await data.getStoryBible(s.id);
      }
    }
    setStoriesByWorld(storyMap);
    setBibles(bibleMap);
  }, []);

  useEffect(() => {
    refresh();
    const unsub = data.subscribeAll(refresh);
    return unsub;
  }, [refresh]);

  return (
    <div className="flex flex-col flex-1 paper-grid px-5 py-6">
      <header className="flex justify-between items-start mb-6 max-w-md w-full mx-auto">
        <div>
          <div className="font-display text-2xl leading-none">
            <span className="marker-highlight">STORY</span>
            <br />
            KEEPER
          </div>
          <div className="annotation mt-2">your library</div>
        </div>
        <Link href="/" className="annotation hover:text-ink">
          &larr; SWITCH
        </Link>
      </header>

      <div className="max-w-md w-full mx-auto flex flex-col gap-10">
        {worlds.length === 0 && (
          <div className="annotation">No stories yet.</div>
        )}
        {worlds.map((w, wi) => {
          const stories = storiesByWorld[w.id] ?? [];
          return (
            <section key={w.id}>
              <div className="annotation ink mb-2 px-1">
                WORLD {wi + 1}. {w.name.toUpperCase()}
              </div>
              {w.description && (
                <div className="text-sm text-muted mb-3 px-1 italic">
                  {w.description}
                </div>
              )}
              {stories.length === 0 && (
                <div className="annotation mb-2">No stories in this world yet.</div>
              )}
              <div className="flex flex-col gap-6">
                {stories.map((s, si) => (
                  <Link
                    key={s.id}
                    href={`/kid/${s.id}`}
                    className={`sketched-box ${HUE_MARKER[w.coverHue]} block px-4 py-4 relative ${
                      si % 2 === 0 ? 'self-start w-[92%]' : 'self-end w-[92%]'
                    }`}
                  >
                    <div className="annotation absolute -top-4 left-5">
                      STORY {si + 1}
                    </div>
                    <div className="font-display text-xl mb-2">{s.title}</div>
                    <CharacterPills bible={bibles[s.id] ?? null} limit={3} />
                    <div className="text-sm font-bold mt-3 text-muted">
                      Tap to read &rarr;
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
