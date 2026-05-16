'use client';

import { useEffect, useRef, useState } from 'react';
import type { StoryNode } from '@/lib/types';

export function Bubble({ node }: { node: StoryNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => {
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
  }, []);

  const toggle = () => {
    if (node.audioUrl) {
      if (!audioRef.current) audioRef.current = new Audio(node.audioUrl);
      const a = audioRef.current;
      if (playing) {
        a.pause();
        setPlaying(false);
      } else {
        window.speechSynthesis?.cancel();
        a.play();
        setPlaying(true);
        a.onended = () => setPlaying(false);
      }
    } else if (node.text) {
      if (playing) {
        window.speechSynthesis.cancel();
        setPlaying(false);
      } else {
        const u = new SpeechSynthesisUtterance(node.text);
        u.rate = 0.92;
        u.pitch = 1.05;
        u.onend = () => setPlaying(false);
        window.speechSynthesis.speak(u);
        setPlaying(true);
      }
    }
  };

  if (node.type === 'kid_text') {
    return (
      <div className="self-end max-w-[85%] bg-kid-soft border-r-4 border-kid rounded-2xl px-5 py-3.5 shadow-sm text-right">
        <div className="text-[11px] tracking-[0.16em] uppercase text-muted mb-1.5">{node.who}</div>
        <div className="leading-[1.55]">{node.text}</div>
      </div>
    );
  }

  const isPrompt = node.type === 'prompt';

  return (
    <div className="self-start max-w-[85%] bg-parent-soft border-l-4 border-parent rounded-2xl px-5 py-3.5 shadow-sm">
      <div className="text-[11px] tracking-[0.16em] uppercase text-muted mb-1.5">
        {node.who}
        {isPrompt && ' · question'}
      </div>
      <div className="leading-[1.55]">{node.text}</div>
      <button
        onClick={toggle}
        type="button"
        className="mt-2.5 inline-flex items-center gap-1 bg-parent text-white rounded-full px-3.5 py-1.5 text-[13px] hover:brightness-95"
      >
        {playing ? '⏸ Pause' : `▶ ${node.audioUrl ? 'Play recording' : 'Hear it read'}`}
      </button>
    </div>
  );
}
