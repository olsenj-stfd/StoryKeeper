'use client';

import type { StoryBible } from '@/lib/types';

const MARKERS = [
  'marker-kid',
  'marker-mint',
  'marker-coral',
  'marker-parent',
] as const;

export function CharacterPills({
  bible,
  limit = 4,
}: {
  bible: StoryBible | null;
  limit?: number;
}) {
  if (!bible || bible.characters.length === 0) return null;
  const shown = bible.characters.slice(0, limit);
  const overflow = bible.characters.length - shown.length;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {shown.map((c, i) => (
        <span
          key={c.name + i}
          className={`sketched-box ${MARKERS[i % MARKERS.length]} text-xs px-2.5 py-0.5 font-display inline-block`}
        >
          {c.name}
        </span>
      ))}
      {overflow > 0 && (
        <span className="annotation">+{overflow} more</span>
      )}
    </div>
  );
}

export function ThemePills({
  bible,
  limit = 5,
}: {
  bible: StoryBible | null;
  limit?: number;
}) {
  if (!bible || bible.themes.length === 0) return null;
  const shown = bible.themes.slice(0, limit);
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {shown.map((t, i) => (
        <span
          key={t + i}
          className="border border-ink/60 rounded-full px-2 py-0.5 text-[11px] tracking-wide uppercase font-display bg-white"
        >
          {t}
        </span>
      ))}
    </div>
  );
}
