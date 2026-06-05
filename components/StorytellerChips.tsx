'use client';

import { useEffect, useState } from 'react';

const DEFAULT_STORYTELLERS = [
  'Mom',
  'Dad',
  'Grandma',
  'Grandpa',
  'Auntie',
  'Uncle',
];
const STORAGE_KEY = 'storykeeper:recentStorytellers';

export function StorytellerChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [recent, setRecent] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setRecent(JSON.parse(stored));
    } catch {
      /* localStorage may be unavailable */
    }
  }, []);

  // De-dupe recent + defaults, recent first, cap at 8 chips.
  const all = Array.from(new Set([...recent, ...DEFAULT_STORYTELLERS])).slice(
    0,
    8,
  );

  const pick = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    onChange(clean);
    const updated = [clean, ...recent.filter((n) => n !== clean)].slice(0, 5);
    setRecent(updated);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  };

  // Stable, distinct color per chip so they read at rest, not just on tap.
  // Picks from the new palette by index across the deduped list.
  const CHIP_COLORS = [
    { bg: '#FFC928', fg: '#3A2F34' }, // yellow
    { bg: '#FF8FAB', fg: '#FFFFFF' }, // pink
    { bg: '#4FBDBA', fg: '#FFFFFF' }, // teal
    { bg: '#A8DDDB', fg: '#3A2F34' }, // mint
    { bg: '#FF5C84', fg: '#FFFFFF' }, // deeper pink
    { bg: '#FFEFB3', fg: '#3A2F34' }, // pale yellow
  ];

  return (
    <div>
      <div className="annotation mb-2">WHO&rsquo;S TELLING?</div>
      <div className="flex flex-wrap gap-2 items-center">
        {all.map((name, i) => {
          const c = CHIP_COLORS[i % CHIP_COLORS.length];
          const selected = value === name;
          return (
            <button
              key={name}
              onClick={() => pick(name)}
              type="button"
              style={{
                backgroundColor: c.bg,
                color: c.fg,
                borderColor: '#3A2F34',
                boxShadow: selected
                  ? '0 0 0 3px #FFC928, 2px 4px 0 #3A2F34'
                  : '2px 2px 0 #3A2F34',
                transform: selected ? 'translate(-1px, -1px)' : undefined,
              }}
              className="px-3 py-1 rounded-full border-2 text-sm font-bold transition"
            >
              {name}
            </button>
          );
        })}
        {!adding ? (
          <button
            onClick={() => setAdding(true)}
            type="button"
            className="px-3 py-1 rounded-full border-2 border-dashed border-ink/60 text-sm font-bold text-ink/70 bg-white hover:text-ink hover:border-ink"
          >
            + Add
          </button>
        ) : (
          <div className="flex gap-1 items-center">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newName.trim()) {
                  pick(newName.trim());
                  setNewName('');
                  setAdding(false);
                } else if (e.key === 'Escape') {
                  setAdding(false);
                  setNewName('');
                }
              }}
              placeholder="Name"
              className="rounded-full border-2 border-ink bg-white px-3 py-1 text-sm w-28"
            />
          </div>
        )}
      </div>
    </div>
  );
}
