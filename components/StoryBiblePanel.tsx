'use client';

import type { StoryBible } from '@/lib/types';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] tracking-[0.16em] uppercase text-muted mb-1.5">{title}</div>
      {children}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-white border border-line rounded-full px-2 py-0.5 text-xs">
      {children}
    </span>
  );
}

export function StoryBiblePanel({
  bible,
  onReindex,
  loading,
}: {
  bible: StoryBible | null;
  onReindex: () => void;
  loading: boolean;
}) {
  return (
    <div className="border border-line rounded-xl bg-white p-4 mb-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="annotation">STORY BIBLE</div>
          {bible?.synopsis && (
            <div className="text-sm text-muted mt-1 italic">{bible.synopsis}</div>
          )}
          {bible?.source && bible.source !== 'claude' && (
            <div className="text-[11px] text-muted/70 mt-1">
              ({bible.source.replace(/-/g, ' ')} — drop ANTHROPIC_API_KEY in .env to get real extraction)
            </div>
          )}
        </div>
        <button
          onClick={onReindex}
          disabled={loading}
          type="button"
          className="text-sm text-parent underline hover:no-underline disabled:opacity-60 whitespace-nowrap"
        >
          {loading ? 'Indexing…' : bible ? 'Re-index' : 'Index this story'}
        </button>
      </div>

      {!bible && (
        <div className="text-sm text-muted">
          No characters yet. Tap &ldquo;Index this story&rdquo; once there&rsquo;s some narration to extract from.
        </div>
      )}

      {bible && (
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <Section title="Characters">
            {bible.characters.length === 0 ? (
              <div className="text-xs text-muted italic">&mdash;</div>
            ) : (
              bible.characters.map((c, i) => (
                <div key={i} className="mb-2">
                  <div className="font-bold">
                    {c.name}{' '}
                    <span className="text-muted font-normal">&middot; {c.role}</span>
                  </div>
                  {c.traits.length > 0 && (
                    <div className="text-muted text-xs">{c.traits.join(', ')}</div>
                  )}
                </div>
              ))
            )}
          </Section>
          <Section title="Themes">
            {bible.themes.length === 0 ? (
              <div className="text-xs text-muted italic">&mdash;</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {bible.themes.map((t, i) => <Pill key={i}>{t}</Pill>)}
              </div>
            )}
          </Section>
          <Section title="Settings">
            {bible.settings.length === 0 ? (
              <div className="text-xs text-muted italic">&mdash;</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {bible.settings.map((s, i) => <Pill key={i}>{s}</Pill>)}
              </div>
            )}
          </Section>
        </div>
      )}
    </div>
  );
}
