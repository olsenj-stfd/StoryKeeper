'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { data } from '@/lib/data';

type ActivityItem = {
  id: string;
  text: string;
  storyId: string;
  href: string;
  ts: number;
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// audience='parent' surfaces what listeners did (kid_text picks).
// audience='kid' surfaces what storytellers added (new voice recordings).
export function RecentActivity({
  audience,
  limit = 5,
}: {
  audience: 'parent' | 'kid';
  limit?: number;
}) {
  const [items, setItems] = useState<ActivityItem[]>([]);

  const refresh = useCallback(async () => {
    const worlds = await data.listWorlds();
    const collected: ActivityItem[] = [];
    for (const w of worlds) {
      const stories = await data.listStoriesByWorld(w.id);
      for (const s of stories) {
        const nodes = await data.listNodes(s.id);
        for (const n of nodes) {
          if (n.createdAt === 0) continue; // skip seed
          if (audience === 'kid' && n.type !== 'voice') continue;
          if (audience === 'parent' && n.type !== 'kid_text') continue;

          const storyName = s.title.trim() || 'an untitled story';
          let text: string;
          let href: string;
          if (audience === 'kid') {
            text = `${n.who} added a new part to "${storyName}"`;
            href = `/kid/${s.id}`;
          } else {
            const snippet = (n.text || '').replace(/\s+/g, ' ').slice(0, 50);
            text = `Listener added "${snippet}${(n.text || '').length > 50 ? '…' : ''}" to "${storyName}"`;
            href = `/parent/${s.id}`;
          }

          collected.push({
            id: n.id,
            text,
            storyId: s.id,
            href,
            ts: n.createdAt,
          });
        }
      }
    }
    collected.sort((a, b) => b.ts - a.ts);
    setItems(collected.slice(0, limit));
  }, [audience, limit]);

  useEffect(() => {
    refresh();
    const unsub = data.subscribeAll(refresh);
    return unsub;
  }, [refresh]);

  if (items.length === 0) return null;

  return (
    <section className="bg-white border-2 border-ink/40 rounded-2xl p-4 mb-6">
      <div className="flex items-baseline justify-between mb-3">
        <div className="annotation ink">RECENT ACTIVITY</div>
        <div className="annotation">on this device</div>
      </div>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.id} className="text-sm flex items-baseline justify-between gap-3">
            <Link
              href={i.href}
              className="hover:underline truncate"
              title={i.text}
            >
              {i.text}
            </Link>
            <span className="annotation whitespace-nowrap">{timeAgo(i.ts)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
