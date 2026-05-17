'use client';

import { useEffect, useState, useCallback, useRef, use } from 'react';
import Link from 'next/link';
import { data } from '@/lib/data';
import type { StoryNode, Story, StoryBible } from '@/lib/types';
import { SketchedBubble } from '@/components/SketchedBubble';
import { BranchPicker } from '@/components/BranchPicker';
import { CharacterPills, ThemePills } from '@/components/CharacterPills';
import { pickBranches } from '@/lib/branches';
import { indexStoryNow } from '@/lib/indexing';

const TARGET_OPTION_COUNT = 4;

function reconstructPath(nodes: StoryNode[], currentId: string): string[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const path: string[] = [];
  let cursor: string | null = currentId;
  while (cursor) {
    const n = byId.get(cursor);
    if (!n) break;
    path.unshift(n.id);
    cursor = n.parentNodeId;
  }
  return path;
}

export default function KidStoryPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = use(params);
  const [story, setStory] = useState<Story | null>(null);
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [bible, setBible] = useState<StoryBible | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const [fallbackChoices, setFallbackChoices] = useState<string[]>([]);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const playAllAudioRef = useRef<HTMLAudioElement | null>(null);
  const playAllCancelledRef = useRef(false);
  const [mode, setMode] = useState<'mom' | 'surprise'>('mom');
  const [surpriseOptions, setSurpriseOptions] = useState<string[]>([]);
  const [loadingSurprise, setLoadingSurprise] = useState(false);

  const refresh = useCallback(async () => {
    const s = await data.getStory(storyId);
    const ns = await data.listNodes(storyId);
    const b = await data.getStoryBible(storyId);
    setStory(s);
    setNodes(ns);
    setBible(b);
    const session = await data.getSession(storyId);
    if (session?.currentNodeId && ns.find((n) => n.id === session.currentNodeId)) {
      setPath(reconstructPath(ns, session.currentNodeId));
    } else if (ns.length > 0) {
      const root = ns.find((n) => n.parentNodeId === null);
      if (root) {
        setPath([root.id]);
        await data.setSession({ storyId, currentNodeId: root.id, updatedAt: Date.now() });
      }
    }
  }, [storyId]);

  useEffect(() => {
    refresh();
    const unsub = data.subscribe(storyId, refresh);
    return unsub;
  }, [refresh, storyId]);

  useEffect(() => {
    if (fallbackChoices.length === 0) setFallbackChoices(pickBranches(TARGET_OPTION_COUNT));
  }, [fallbackChoices.length]);

  const currentId = path[path.length - 1];
  const visibleNodes = path
    .map((id) => nodes.find((n) => n.id === id))
    .filter(Boolean) as StoryNode[];
  const children = nodes
    .filter((n) => n.parentNodeId === currentId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  // Treat every voice child as a branch option — labeled or not. Mom may have
  // recorded multiple continuations at this node without labeling each one.
  const parentRecordedBranches = children.filter((n) => n.type === 'voice');

  const formatVoiceLabel = (n: StoryNode): string => {
    const label = n.branchLabel?.trim();
    if (label) return label;
    const text = n.text?.trim();
    if (!text) return `${n.who}'s recording`;
    return text.length > 90 ? text.slice(0, 87) + '…' : text;
  };

  const pickRecordedBranch = async (childId: string) => {
    setPath([...path, childId]);
    await data.setSession({ storyId, currentNodeId: childId, updatedAt: Date.now() });
  };

  const pickFallback = async (text: string) => {
    const node = await data.appendNode({
      storyId,
      parentNodeId: currentId,
      type: 'kid_text',
      who: 'You',
      text,
      branchLabel: null,
      branchIcon: null,
      orderIndex: children.length,
    });
    setPath([...path, node.id]);
    setFallbackChoices(pickBranches(TARGET_OPTION_COUNT));
    await data.setSession({ storyId, currentNodeId: node.id, updatedAt: Date.now() });
    // New kid content — re-index so the bible picks up any new characters /
    // themes the kid introduced. Fire and forget; the IDB notify path will
    // refresh the panel when it lands.
    void indexStoryNow(storyId);
  };

  // "From Mom" mode: show all of Mom's recorded continuations first, then pad
  // with story-aware AI continuations so there are always at least 4 options.
  // Each option is visually tagged FROM MOM vs MADE UP so the kid can tell.
  // "Surprise me" mode: skip Mom entirely, just AI continuations.
  const recordedOptions = parentRecordedBranches.map((n) => ({
    id: n.id,
    label: formatVoiceLabel(n),
    icon: n.branchIcon,
    fromMom: true as const,
  }));

  const fetchSurpriseOptions = useCallback(async () => {
    setLoadingSurprise(true);
    try {
      const transcript = nodes
        .filter((n) => n.text)
        .map((n) => `${n.who}: ${n.text}`)
        .join('\n');
      const r = await fetch('/api/ai/continuations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          characters: bible?.characters ?? [],
          settings: bible?.settings ?? [],
        }),
      });
      const j = (await r.json()) as { options: string[] };
      setSurpriseOptions(j.options ?? []);
    } finally {
      setLoadingSurprise(false);
    }
  }, [nodes, bible]);

  // Fetch surprise options when switching into surprise mode, when From Mom
  // doesn't have enough on its own, or after the path advances (fresh options
  // for the new node).
  const needsAIFill =
    mode === 'surprise' ||
    (mode === 'mom' && recordedOptions.length < TARGET_OPTION_COUNT);
  useEffect(() => {
    if (needsAIFill) {
      void fetchSurpriseOptions();
    }
  }, [mode, currentId, fetchSurpriseOptions, needsAIFill]);

  const onPickOption = (id: string) => {
    if (parentRecordedBranches.some((n) => n.id === id)) {
      void pickRecordedBranch(id);
    } else {
      void pickFallback(id);
    }
  };

  const surpriseAsOptions = surpriseOptions.map((t) => ({
    id: t,
    label: t,
    fromMom: false as const,
  }));

  // From Mom mode: Mom's options + AI fill to reach TARGET_OPTION_COUNT.
  const momMixedOptions = [
    ...recordedOptions,
    ...surpriseAsOptions.slice(
      0,
      Math.max(0, TARGET_OPTION_COUNT - recordedOptions.length),
    ),
  ];

  const stopPlayAll = useCallback(() => {
    playAllCancelledRef.current = true;
    if (playAllAudioRef.current) {
      playAllAudioRef.current.pause();
      playAllAudioRef.current.onended = null;
      playAllAudioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setPlayingIndex(null);
  }, []);

  const playAll = useCallback(() => {
    if (visibleNodes.length === 0) return;
    // Cancel any in-flight per-bubble playback first
    window.speechSynthesis?.cancel();
    playAllCancelledRef.current = false;

    const playOne = (i: number) => {
      if (playAllCancelledRef.current) return;
      if (i >= visibleNodes.length) {
        setPlayingIndex(null);
        return;
      }
      setPlayingIndex(i);
      const node = visibleNodes[i];
      const advance = () => {
        if (playAllCancelledRef.current) return;
        // Small gap between bubbles so it doesn't feel rushed
        setTimeout(() => playOne(i + 1), 350);
      };

      if (node.audioUrl) {
        const a = new Audio(node.audioUrl);
        playAllAudioRef.current = a;
        a.onended = advance;
        a.onerror = advance;
        a.play().catch(advance);
      } else if (node.text) {
        const u = new SpeechSynthesisUtterance(node.text);
        u.rate = 0.92;
        u.pitch = 1.05;
        u.onend = advance;
        u.onerror = advance;
        window.speechSynthesis.speak(u);
      } else {
        advance();
      }
    };
    playOne(0);
  }, [visibleNodes]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount: kill any in-flight play-all
      playAllCancelledRef.current = true;
      playAllAudioRef.current?.pause();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const reset = async () => {
    if (!confirm('Start the story over? (Recordings stay; your path resets.)')) return;
    await data.setSession({ storyId, currentNodeId: null, updatedAt: Date.now() });
    setPath([]);
    setFallbackChoices(pickBranches(TARGET_OPTION_COUNT));
    refresh();
  };

  const voiceCounter = { n: 0 };

  return (
    <div className="flex flex-col flex-1 paper-grid">
      <header className="px-5 pt-4 pb-3 border-b-2 border-dashed border-ink/30 flex justify-between items-end gap-4">
        <div>
          <div className="annotation">
            FILE: {storyId.toUpperCase()}_01
          </div>
          <div className="font-display text-2xl mt-1">
            <span className="marker-highlight mint">{story?.title?.split(' ')[0] ?? '…'}</span>
            {story?.title ? ' ' + story.title.split(' ').slice(1).join(' ') : ''}
          </div>
        </div>
        <Link href="/" className="annotation hover:text-ink">
          &larr; SWITCH
        </Link>
      </header>

      {bible && (bible.characters.length > 0 || bible.themes.length > 0) && (
        <div className="px-5 pt-4 max-w-3xl w-full mx-auto">
          {bible.characters.length > 0 && (
            <div className="mb-3">
              <div className="annotation mb-1.5">WHO&rsquo;S IN THIS STORY</div>
              <CharacterPills bible={bible} limit={6} />
            </div>
          )}
          {bible.themes.length > 0 && (
            <div>
              <div className="annotation mb-1.5">FEELS LIKE</div>
              <ThemePills bible={bible} limit={5} />
            </div>
          )}
        </div>
      )}

      {visibleNodes.length > 0 && (
        <div className="px-5 pt-4 max-w-3xl w-full mx-auto flex items-center gap-3 flex-wrap">
          {playingIndex === null ? (
            <button
              onClick={playAll}
              type="button"
              className="sketched-btn marker-coral"
            >
              <span>▶</span> PLAY THE WHOLE STORY
            </button>
          ) : (
            <>
              <button
                onClick={stopPlayAll}
                type="button"
                className="sketched-btn marker-coral"
              >
                <span>■</span> STOP
              </button>
              <div className="annotation ink">
                PLAYING {playingIndex + 1} OF {visibleNodes.length}
              </div>
            </>
          )}
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-5 py-8 flex flex-col gap-6 max-w-3xl w-full mx-auto">
        {visibleNodes.map((n) => {
          const fig = n.type === 'voice' ? ++voiceCounter.n : undefined;
          return <SketchedBubble key={n.id} node={n} fig={fig} />;
        })}
      </main>

      <footer className="border-t-2 border-dashed border-ink/30 px-5 py-5 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="annotation ink">
              YOUR TURN &mdash; WHAT HAPPENS NEXT?
            </div>
            <div className="flex gap-1 bg-cream-soft rounded-full p-1 text-xs border border-ink/30">
              <button
                onClick={() => setMode('mom')}
                type="button"
                className={`px-3 py-1 rounded-full font-display tracking-wide ${
                  mode === 'mom' ? 'bg-white text-ink' : 'text-muted'
                }`}
              >
                FROM MOM
              </button>
              <button
                onClick={() => setMode('surprise')}
                type="button"
                className={`px-3 py-1 rounded-full font-display tracking-wide ${
                  mode === 'surprise' ? 'bg-white text-ink' : 'text-muted'
                }`}
              >
                SURPRISE ME
              </button>
            </div>
          </div>

          {mode === 'mom' ? (
            <>
              {momMixedOptions.length > 0 ? (
                <BranchPicker options={momMixedOptions} onPick={onPickOption} />
              ) : loadingSurprise ? (
                <div className="annotation">Thinking up some ideas&hellip;</div>
              ) : (
                <div className="sketched-box marker-mint p-4">
                  <div className="font-bold text-sm">
                    Nothing recorded yet! Pulling some ideas&hellip;
                  </div>
                </div>
              )}
              {loadingSurprise && momMixedOptions.length > 0 && (
                <div className="annotation mt-2">
                  Topping up with fresh ideas&hellip;
                </div>
              )}
            </>
          ) : loadingSurprise && surpriseAsOptions.length === 0 ? (
            <div className="annotation">Thinking up some ideas&hellip;</div>
          ) : (
            <>
              <BranchPicker options={surpriseAsOptions} onPick={onPickOption} />
              {loadingSurprise && (
                <div className="annotation mt-2">
                  Cooking up fresh ideas&hellip;
                </div>
              )}
            </>
          )}

          <button
            onClick={reset}
            className="mt-4 text-xs text-muted hover:text-ink underline font-display"
          >
            start the story over
          </button>
        </div>
      </footer>
    </div>
  );
}
