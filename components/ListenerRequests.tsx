'use client';

import { useCallback, useEffect, useState } from 'react';
import { data } from '@/lib/data';
import type { StoryNode } from '@/lib/types';
import { RecordButton } from './RecordButton';
import { indexStoryNow } from '@/lib/indexing';

type Request = {
  node: StoryNode;
  storyId: string;
  storyTitle: string;
};

export function ListenerRequests({
  defaultWho = 'Mom',
}: {
  defaultWho?: string;
}) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [who, setWho] = useState(defaultWho);

  const refresh = useCallback(async () => {
    const worlds = await data.listWorlds();
    const collected: Request[] = [];
    for (const w of worlds) {
      const stories = await data.listStoriesByWorld(w.id);
      for (const s of stories) {
        const nodes = await data.listNodes(s.id);
        for (const n of nodes) {
          // A "request" is a kid_text beat that the parent hasn't voiced yet.
          if (n.type === 'kid_text' && !n.audioUrl) {
            collected.push({
              node: n,
              storyId: s.id,
              storyTitle: s.title.trim() || 'untitled story',
            });
          }
        }
      }
    }
    collected.sort((a, b) => b.node.createdAt - a.node.createdAt);
    setRequests(collected.slice(0, 5));
  }, []);

  useEffect(() => {
    refresh();
    const unsub = data.subscribeAll(refresh);
    return unsub;
  }, [refresh]);

  if (requests.length === 0) return null;

  const fulfill = async (req: Request, blob: Blob, transcript: string) => {
    await data.fulfillKidRequest(
      req.node.id,
      blob,
      who,
      transcript.trim() || req.node.text || '',
    );
    setRespondingTo(null);
    void indexStoryNow(req.storyId);
    refresh();
  };

  return (
    <section className="bg-white border-[3px] border-ink rounded-2xl p-4 chunky-shadow">
      <div className="flex items-baseline justify-between mb-3">
        <div className="annotation ink">LISTENER REQUESTS</div>
        <div className="annotation">they picked it — voice it</div>
      </div>
      <ul className="space-y-3">
        {requests.map((r) => {
          const isActive = respondingTo === r.node.id;
          return (
            <li key={r.node.id} className="border-2 border-ink rounded-xl p-3">
              <div className="text-sm font-bold leading-snug">
                &ldquo;{r.node.text}&rdquo;
              </div>
              <div className="annotation mt-1">
                in &quot;{r.storyTitle}&quot;
              </div>

              {!isActive ? (
                <button
                  type="button"
                  onClick={() => setRespondingTo(r.node.id)}
                  className="sketched-btn marker-coral mt-3"
                >
                  🎙️ RECORD IN YOUR VOICE
                </button>
              ) : (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2 items-center flex-wrap">
                    <label className="annotation">YOU ARE</label>
                    <input
                      value={who}
                      onChange={(e) => setWho(e.target.value)}
                      placeholder="Mom"
                      className="rounded-full border-2 border-ink bg-white px-3 py-1 text-sm w-28"
                    />
                  </div>
                  <div className="flex gap-2 justify-between items-center flex-wrap">
                    <button
                      type="button"
                      onClick={() => setRespondingTo(null)}
                      className="annotation hover:text-ink"
                    >
                      ← CANCEL
                    </button>
                    <RecordButton
                      onRecorded={(blob, transcript) =>
                        fulfill(r, blob, transcript)
                      }
                    />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
