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

  return (
    <div>
      <div className="annotation mb-2">WHO&rsquo;S TELLING?</div>
      <div className="flex flex-wrap gap-2 items-center">
        {all.map((name) => (
          <button
            key={name}
            onClick={() => pick(name)}
            type="button"
            className={`px-3 py-1 rounded-full border-2 text-sm transition ${
              value === name
                ? 'bg-parent text-white border-parent'
                : 'bg-white border-ink/40 hover:border-ink'
            }`}
          >
            {name}
          </button>
        ))}
        {!adding ? (
          <button
            onClick={() => setAdding(true)}
            type="button"
            className="px-3 py-1 rounded-full border-2 border-dashed border-ink/40 text-sm text-muted hover:text-ink hover:border-ink"
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
              className="rounded-full border-2 border-ink/60 bg-white px-3 py-1 text-sm w-28"
            />
          </div>
        )}
      </div>
    </div>
  );
}
