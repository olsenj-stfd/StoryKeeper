'use client';

import { useCallback, useEffect, useState } from 'react';
import { data } from '@/lib/data';

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type ThemeCount = { theme: string; count: number };

export function ThemesThisWeek({ limit = 6 }: { limit?: number }) {
  const [themes, setThemes] = useState<ThemeCount[]>([]);

  const refresh = useCallback(async () => {
    const cutoff = Date.now() - WINDOW_MS;
    const tally: Record<string, number> = {};
    const worlds = await data.listWorlds();
    for (const w of worlds) {
      const stories = await data.listStoriesByWorld(w.id);
      for (const s of stories) {
        const bible = await data.getStoryBible(s.id);
        if (!bible) continue;
        if (bible.updatedAt && bible.updatedAt < cutoff) continue;
        for (const raw of bible.themes ?? []) {
          const t = raw.trim().toLowerCase();
          if (!t) continue;
          tally[t] = (tally[t] ?? 0) + 1;
        }
      }
    }
    const ranked: ThemeCount[] = Object.entries(tally)
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    setThemes(ranked);
  }, [limit]);

  useEffect(() => {
    refresh();
    const unsub = data.subscribeAll(refresh);
    return unsub;
  }, [refresh]);

  if (themes.length === 0) return null;

  return (
    <section className="bg-white border-[3px] border-ink rounded-2xl p-4 chunky-shadow">
      <div className="flex items-baseline justify-between mb-3">
        <div className="annotation ink">THEMES THIS WEEK</div>
        <div className="annotation">last 7 days</div>
      </div>
      <div className="flex flex-wrap gap-2">
        {themes.map((t) => (
          <span
            key={t.theme}
            className="inline-flex items-center gap-1.5 bg-yellow border-2 border-ink rounded-full px-3 py-1 text-sm font-bold"
          >
            <span className="capitalize">{t.theme}</span>
            <span className="tag-badge bg-pink">{t.count}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
