'use client';

import { useEffect, useRef, useState } from 'react';
import type { StoryNode } from '@/lib/types';

export function SketchedBubble({
  node,
  fig,
}: {
  node: StoryNode;
  fig?: number;
}) {
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
      <div className="self-end max-w-[88%] relative mr-2 mt-4">
        <div className="annotation ink absolute -top-4 right-4">YOUR TURN</div>
        <div className="sketched-box marker-kid px-5 py-4">
          <div className="text-right font-bold">{node.text}</div>
        </div>
      </div>
    );
  }

  const isPrompt = node.type === 'prompt';

  return (
    <div className="self-start max-w-[92%] relative ml-1 mt-5">
      <div className="annotation absolute -top-4 left-5">
        {fig !== undefined && `FIG ${fig}.`} AUTHOR:{' '}
        <span className="ink">{node.who.toUpperCase()}</span>
        {isPrompt && ' · QUESTION'}
      </div>
      <div className="sketched-box marker-parent px-5 py-4">
        <div className="font-bold leading-snug">{node.text}</div>
        <button onClick={toggle} className="sketched-btn marker-mint mt-3" type="button">
          {playing ? (
            <><span>⏸</span> PAUSE</>
          ) : (
            <><span>▶</span> {node.audioUrl ? 'PLAY' : 'READ IT'}</>
          )}
        </button>
      </div>
    </div>
  );
}
