'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { data } from '@/lib/data';
import type { StoryNode, Story, StoryBible } from '@/lib/types';
import { Bubble } from '@/components/Bubble';
import { RecordButton } from '@/components/RecordButton';
import { UploadButton } from '@/components/UploadButton';
import { StoryBiblePanel } from '@/components/StoryBiblePanel';

type DraftKind = 'voice' | 'prompt';

export default function ParentStoryPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = use(params);
  const [story, setStory] = useState<Story | null>(null);
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [bible, setBible] = useState<StoryBible | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [who, setWho] = useState('Mom');
  const [text, setText] = useState('');
  const [branchLabel, setBranchLabel] = useState('');
  const [kind, setKind] = useState<DraftKind>('voice');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(false);

  const refresh = useCallback(async () => {
    const s = await data.getStory(storyId);
    const ns = await data.listNodes(storyId);
    const b = await data.getStoryBible(storyId);
    setStory(s);
    setNodes(ns);
    setBible(b);
    setSelectedParentId((prev) => prev ?? ns[ns.length - 1]?.id ?? null);
  }, [storyId]);

  useEffect(() => {
    refresh();
    const unsub = data.subscribe(storyId, refresh);
    return unsub;
  }, [refresh, storyId]);

  const siblings = nodes.filter((n) => n.parentNodeId === selectedParentId);

  const saveAudioNode = async (blob: Blob, isUpload = false) => {
    if (!selectedParentId && nodes.length > 0) {
      alert('Tap a bubble above to choose where this attaches.');
      return;
    }
    const fallbackText = isUpload
      ? `(${who} uploaded a recording.)`
      : `(${who} recorded the next part of the story.)`;
    const node = await data.appendNode(
      {
        storyId,
        parentNodeId: selectedParentId,
        type: kind,
        who,
        text: text.trim() || fallbackText,
        branchLabel: branchLabel.trim() || null,
        branchIcon: null,
        orderIndex: siblings.length,
      },
      blob,
    );
    setText('');
    setBranchLabel('');
    setSelectedParentId(node.id);
    // Fire-and-forget: re-index the story so the bible stays fresh.
    void indexStory();
  };

  const fetchAiSuggestions = async () => {
    setLoadingBranches(true);
    try {
      const transcript = nodes
        .filter((n) => n.text)
        .map((n) => `${n.who}: ${n.text}`)
        .join('\n');
      const r = await fetch('/api/ai/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      const j = await r.json();
      setSuggestions(j.branches ?? []);
    } finally {
      setLoadingBranches(false);
    }
  };

  const indexStory = async () => {
    setLoadingIndex(true);
    try {
      const transcript = nodes
        .filter((n) => n.text)
        .map((n) => `${n.who}: ${n.text}`)
        .join('\n');
      const r = await fetch('/api/ai/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId, transcript }),
      });
      const j = (await r.json()) as StoryBible;
      await data.setStoryBible(j);
      setBible(j);
    } finally {
      setLoadingIndex(false);
    }
  };

  return (
    <>
      <header className="px-5 pt-4 pb-3 border-b border-dashed border-line bg-white flex justify-between items-end gap-4">
        <div>
          <div className="annotation">STORYKEEPER &middot; PARENT</div>
          <div className="text-xl font-semibold mt-1">{story?.title ?? 'Loading…'}</div>
        </div>
        <Link href="/" className="annotation hover:text-ink">
          &larr; SWITCH
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-6 max-w-3xl w-full mx-auto">
        <StoryBiblePanel bible={bible} onReindex={indexStory} loading={loadingIndex} />

        <div className="text-[12px] tracking-[0.16em] uppercase text-muted mb-2.5">
          Tap a bubble to attach the next part to it
        </div>
        <div className="flex flex-col gap-3">
          {nodes.map((n) => (
            <div
              key={n.id}
              onClick={() => setSelectedParentId(n.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedParentId(n.id);
                }
              }}
              className={`rounded-2xl p-1 transition cursor-pointer flex ${
                selectedParentId === n.id
                  ? 'ring-2 ring-parent'
                  : 'opacity-80 hover:opacity-100'
              } ${n.type === 'kid_text' ? 'justify-end' : 'justify-start'}`}
            >
              <Bubble node={n} />
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-dashed border-line bg-white px-5 py-4">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="flex items-center gap-2">
            <div className="text-[12px] tracking-[0.16em] uppercase text-muted">
              {kind === 'voice' ? 'Add the next part' : 'Record a choice prompt'}
            </div>
            <div className="ml-auto flex gap-1 bg-[#ece2cf] rounded-full p-1 text-sm">
              {(['voice', 'prompt'] as DraftKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`px-3 py-1 rounded-full ${
                    kind === k ? 'bg-white' : 'text-muted'
                  }`}
                >
                  {k === 'voice' ? 'Story' : 'Branch'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-[120px_1fr] gap-2">
            <input
              value={who}
              onChange={(e) => setWho(e.target.value)}
              placeholder="Mom"
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
            />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                kind === 'voice'
                  ? 'A one-line summary (helps AI indexing)'
                  : 'What is the question?'
              }
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
            />
          </div>

          {kind === 'voice' && (
            <input
              value={branchLabel}
              onChange={(e) => setBranchLabel(e.target.value)}
              placeholder="Branch label (optional, e.g. &lsquo;the adventure path&rsquo;)"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
            />
          )}

          <div className="flex justify-between items-center gap-3 flex-wrap">
            <button
              onClick={fetchAiSuggestions}
              disabled={loadingBranches}
              type="button"
              className="text-sm text-parent underline hover:no-underline disabled:opacity-60"
            >
              {loadingBranches ? 'Thinking…' : 'Suggest branches'}
            </button>
            <div className="flex items-center gap-2">
              <UploadButton onFile={(f) => saveAudioNode(f, true)} />
              <RecordButton onRecorded={(b) => saveAudioNode(b, false)} />
            </div>
          </div>

          {suggestions.length > 0 && (
            <div className="bg-parent-soft border border-parent/30 rounded-xl p-3 space-y-1.5">
              <div className="text-[11px] tracking-[0.16em] uppercase text-muted mb-1">
                Ideas (tap to use as the branch label)
              </div>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setBranchLabel(s)}
                  className="block w-full text-left text-sm bg-white/60 rounded px-2 py-1.5 hover:bg-white"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </footer>
    </>
  );
}
