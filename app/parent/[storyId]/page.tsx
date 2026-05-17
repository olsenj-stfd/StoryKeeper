'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { data } from '@/lib/data';
import type { StoryNode, Story, StoryBible } from '@/lib/types';
import { Bubble } from '@/components/Bubble';
import { RecordButton } from '@/components/RecordButton';
import { StoryBiblePanel } from '@/components/StoryBiblePanel';
import { indexStoryNow } from '@/lib/indexing';
import { useModeLabels } from '@/lib/mode';

export default function ParentStoryPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = use(params);
  const labels = useModeLabels();
  const [story, setStory] = useState<Story | null>(null);
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [bible, setBible] = useState<StoryBible | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [who, setWho] = useState('Mom');
  const [notes, setNotes] = useState('');
  const [loadingIndex, setLoadingIndex] = useState(false);
  const [noSpeech, setNoSpeech] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as unknown as {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    };
    if (!w.SpeechRecognition && !w.webkitSpeechRecognition) {
      setNoSpeech(true);
    }
  }, []);

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

  const indexStory = useCallback(async () => {
    setLoadingIndex(true);
    try {
      const j = await indexStoryNow(storyId);
      if (j) setBible(j);
    } finally {
      setLoadingIndex(false);
    }
  }, [storyId]);

  // After saving a node, ask Claude (background) to generate a short
  // branch label from the transcript/summary. Parent doesn't have to
  // type anything; the label appears within seconds.
  const autoLabelNode = useCallback(
    async (nodeId: string, transcript: string, summary: string) => {
      try {
        const storyContext = nodes
          .filter((n) => n.text)
          .map((n) => `${n.who}: ${n.text}`)
          .join('\n');
        const r = await fetch('/api/ai/label', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, summary, storyContext }),
        });
        const j = await r.json();
        const label = String(j.branchLabel ?? '').trim();
        if (label) {
          await data.updateNode(nodeId, { branchLabel: label });
        }
      } catch {
        /* leave label blank if it fails — the bubble still works */
      }
    },
    [nodes],
  );

  const saveAudioNode = async (blob: Blob, transcript: string) => {
    if (!selectedParentId && nodes.length > 0) {
      alert('Tap a bubble above to choose where this attaches.');
      return;
    }
    const summary = notes.trim();
    const cleanTranscript = transcript.trim();
    // Prefer transcript (full content) for AI text; fall back to typed notes;
    // last resort is a generic line.
    const nodeText =
      cleanTranscript ||
      summary ||
      `(${who} recorded the next part of the story.)`;
    const node = await data.appendNode(
      {
        storyId,
        parentNodeId: selectedParentId,
        type: 'voice',
        who,
        text: nodeText,
        branchLabel: null, // AI labels in background, parent edits later
        branchIcon: null,
        orderIndex: siblings.length,
      },
      blob,
    );
    setNotes('');
    setSelectedParentId(node.id);
    // Fire-and-forget: re-index the story and auto-label the new node.
    void indexStory();
    void autoLabelNode(node.id, cleanTranscript, summary);
  };

  return (
    <>
      <header className="px-5 pt-4 pb-3 border-b border-dashed border-line bg-white flex justify-between items-end gap-4">
        <div className="flex-1 min-w-0">
          <div className="annotation">
            {labels.brand.toUpperCase()} &middot; {labels.storytellerUpper}
          </div>
          <input
            value={story?.title ?? ''}
            onChange={(e) => setStory((s) => (s ? { ...s, title: e.target.value } : s))}
            onBlur={(e) => {
              if (story) {
                void data.updateStory(storyId, { title: e.target.value.trim() });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            placeholder="Name this story…"
            className="text-xl font-semibold mt-1 w-full bg-transparent outline-none border-b border-transparent focus:border-parent placeholder:text-muted placeholder:italic"
          />
        </div>
        <Link href="/" className="annotation hover:text-ink shrink-0">
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
              className={`rounded-2xl p-1 transition cursor-pointer flex flex-col ${
                selectedParentId === n.id
                  ? 'ring-2 ring-parent'
                  : 'opacity-80 hover:opacity-100'
              } ${n.type === 'kid_text' ? 'items-end' : 'items-start'}`}
            >
              <Bubble node={n} />
              {n.type === 'voice' && (
                <InlineLabelEditor
                  node={n}
                  onSave={(label) =>
                    data.updateNode(n.id, { branchLabel: label.trim() || null })
                  }
                />
              )}
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-dashed border-line bg-white px-5 py-4">
        <div className="max-w-3xl mx-auto space-y-3">
          {noSpeech && (
            <div className="bg-kid-soft border-2 border-ink/40 rounded-xl px-3 py-2.5 text-sm">
              <strong>This device can&rsquo;t auto-transcribe.</strong> Jot a
              one-line note below before tapping Record so the AI has something
              to read and label.
            </div>
          )}

          <div className="text-[12px] tracking-[0.16em] uppercase text-muted">
            Add the next part
          </div>

          <div className="grid sm:grid-cols-[120px_1fr] gap-2">
            <input
              value={who}
              onChange={(e) => setWho(e.target.value)}
              placeholder="Mom"
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
            />
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                noSpeech
                  ? 'One-line note (used as the transcript on this device)'
                  : 'Optional one-line note (AI fills in from your voice)'
              }
              className={`rounded-lg border bg-white px-3 py-2 text-sm ${
                noSpeech ? 'border-2 border-ink/60' : 'border-line'
              }`}
            />
          </div>

          <div className="flex justify-end">
            <RecordButton onRecorded={saveAudioNode} />
          </div>

          <div className="text-[11px] text-muted text-right italic">
            Branch labels are auto-generated. Tap a bubble&rsquo;s label above to
            edit it.
          </div>
        </div>
      </footer>
    </>
  );
}

function InlineLabelEditor({
  node,
  onSave,
}: {
  node: StoryNode;
  onSave: (label: string) => Promise<void> | void;
}) {
  const [value, setValue] = useState(node.branchLabel ?? '');
  useEffect(() => {
    setValue(node.branchLabel ?? '');
  }, [node.branchLabel]);

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if ((node.branchLabel ?? '') !== value) {
          void onSave(value);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
      placeholder={
        node.branchLabel === null
          ? 'AI is labeling this…'
          : 'Branch label (tap to edit)'
      }
      className="mt-1.5 max-w-[85%] text-xs font-display tracking-wide bg-transparent border-b border-dashed border-line focus:border-parent focus:outline-none px-1 placeholder:italic placeholder:text-muted"
    />
  );
}
