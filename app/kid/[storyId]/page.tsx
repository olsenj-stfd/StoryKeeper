'use client';

import { useEffect, useState, useCallback, use } from 'react';
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
  const parentRecordedBranches = children.filter(
    (n) => n.type === 'voice' && n.branchLabel,
  );

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

  // Always surface at least TARGET_OPTION_COUNT options. Start with the parent-recorded
  // branches, then fill the rest from the curated fallback pool.
  const recordedOptions = parentRecordedBranches.map((n) => ({
    id: n.id,
    label: n.branchLabel ?? '',
    icon: n.branchIcon,
  }));
  const fillCount = Math.max(
    0,
    TARGET_OPTION_COUNT - recordedOptions.length,
  );
  const fallbackOptions = fallbackChoices.slice(0, fillCount).map((t) => ({
    id: t,
    label: t,
  }));
  const allOptions = [...recordedOptions, ...fallbackOptions];

  const onPickOption = (id: string) => {
    if (parentRecordedBranches.some((n) => n.id === id)) {
      void pickRecordedBranch(id);
    } else {
      void pickFallback(id);
    }
  };

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

      <main className="flex-1 overflow-y-auto px-5 py-8 flex flex-col gap-6 max-w-3xl w-full mx-auto">
        {visibleNodes.map((n) => {
          const fig = n.type === 'voice' ? ++voiceCounter.n : undefined;
          return <SketchedBubble key={n.id} node={n} fig={fig} />;
        })}
      </main>

      <footer className="border-t-2 border-dashed border-ink/30 px-5 py-5 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="annotation ink mb-3">
            YOUR TURN &mdash; WHAT HAPPENS NEXT?
          </div>
          <BranchPicker options={allOptions} onPick={onPickOption} />
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
