'use client';

import { useCallback, useEffect, useState } from 'react';
import { data } from '@/lib/data';
import type { Story, World } from '@/lib/types';

type BookStyle = 'illustrated' | 'blank';

export default function OrderPage() {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [stories, setStories] = useState<Record<string, Story[]>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [style, setStyle] = useState<BookStyle>('blank');
  const [placed, setPlaced] = useState(false);

  const refresh = useCallback(async () => {
    const ws = await data.listWorlds();
    setWorlds(ws);
    const map: Record<string, Story[]> = {};
    for (const w of ws) {
      map[w.id] = (await data.listStoriesByWorld(w.id)).filter((s) =>
        s.title.trim(),
      );
    }
    setStories(map);
  }, []);

  useEffect(() => {
    refresh();
    const unsub = data.subscribeAll(refresh);
    return unsub;
  }, [refresh]);

  const place = () => {
    if (!selected) return;
    setPlaced(true);
  };

  const selectedStory =
    Object.values(stories)
      .flat()
      .find((s) => s.id === selected) ?? null;

  return (
    <div className="flex-1 px-5 py-6 max-w-2xl w-full mx-auto">
      <header className="mb-6 pb-3 border-b border-dashed border-ink/40">
        <div className="annotation">MOONJAR STORIES &middot; ORDER</div>
        <div className="font-display text-2xl mt-1">
          Turn a story into a <span className="marker-highlight kid">BOOK</span>
        </div>
        <div className="text-sm text-muted mt-1">
          Pick a story, choose illustrated or blank, and we&rsquo;ll print a real keepsake.
        </div>
      </header>

      {placed ? (
        <section className="sketched-box marker-mint p-6 relative text-center">
          <div className="annotation absolute -top-4 left-5">ORDER PLACED</div>
          <div className="font-display text-2xl mb-2">
            <span className="marker-highlight">YOUR</span> BOOK IS ON THE WAY!
          </div>
          <div className="text-sm mb-4">
            {selectedStory?.title} &mdash; {style === 'illustrated' ? 'fully illustrated' : 'blank coloring book'}
          </div>
          <div className="text-xs text-muted italic">
            (This is a placeholder. A real version would hit a print-on-demand
            service like Lulu, Blurb, or Shutterfly here.)
          </div>
          <button
            type="button"
            onClick={() => {
              setPlaced(false);
              setSelected(null);
            }}
            className="sketched-btn mt-4"
          >
            ORDER ANOTHER
          </button>
        </section>
      ) : (
        <>
          <section className="mb-6">
            <div className="annotation mb-2">1. PICK A STORY</div>
            {worlds.length === 0 ||
            Object.values(stories).every((arr) => arr.length === 0) ? (
              <div className="text-sm text-muted italic">
                No named stories yet &mdash; record one and name it first.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {worlds.map((w) =>
                  (stories[w.id] ?? []).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelected(s.id)}
                      className={`text-left bg-white border-2 rounded-lg px-3 py-2.5 transition ${
                        selected === s.id
                          ? 'border-parent ring-2 ring-parent/40'
                          : 'border-ink/70 hover:border-ink'
                      }`}
                    >
                      <div className="annotation">{w.name.toUpperCase()}</div>
                      <div className="font-bold text-sm mt-0.5">{s.title}</div>
                    </button>
                  )),
                )}
              </div>
            )}
          </section>

          <section className="mb-6">
            <div className="annotation mb-2">2. CHOOSE A STYLE</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStyle('illustrated')}
                className={`sketched-box ${
                  style === 'illustrated' ? 'marker-parent' : 'marker-mint'
                } p-4 text-left`}
              >
                <div className="font-display text-lg">FULLY ILLUSTRATED</div>
                <div className="text-sm mt-1">
                  AI generates art for each page. Ready to read.
                </div>
              </button>
              <button
                type="button"
                onClick={() => setStyle('blank')}
                className={`sketched-box ${
                  style === 'blank' ? 'marker-parent' : 'marker-kid'
                } p-4 text-left`}
              >
                <div className="font-display text-lg">BLANK COLORING BOOK</div>
                <div className="text-sm mt-1">
                  Words only, big blank panels for the kid to draw.
                </div>
              </button>
            </div>
          </section>

          <section>
            <button
              type="button"
              disabled={!selected}
              onClick={place}
              className="sketched-btn marker-coral text-lg disabled:opacity-50"
            >
              ORDER MY BOOK &rarr;
            </button>
            <div className="text-xs text-muted mt-2 italic">
              (Future: this hits a print-on-demand API.)
            </div>
          </section>
        </>
      )}
    </div>
  );
}
