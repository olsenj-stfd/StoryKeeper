'use client';

import Link from 'next/link';
import { useMode, useModeLabels } from '@/lib/mode';

export default function StartPage() {
  const mode = useMode();
  const labels = useModeLabels();
  const isFamily = mode === 'family';

  return (
    <div className="flex flex-col flex-1 paper-grid px-5 py-6">
      <header className="flex justify-between items-start mb-6 max-w-md w-full mx-auto">
        <div>
          <div className="annotation">
            {labels.brand.toUpperCase()} &middot; WHO&rsquo;S HERE
          </div>
          <h1
            className={
              isFamily
                ? 'text-3xl mt-2 leading-tight font-semibold'
                : 'font-display text-3xl mt-2 leading-tight'
            }
          >
            <span className="marker-highlight">WHO</span> IS USING{' '}
            {labels.brand.toUpperCase()}?
          </h1>
        </div>
      </header>

      <div className="flex justify-between items-baseline mb-8 px-1 max-w-md w-full mx-auto">
        <div className="annotation">FILE: {labels.brand.toUpperCase()}_001</div>
        <div className="annotation ink">AUTHOR: YOU</div>
      </div>

      <div className="flex flex-col gap-12 max-w-md mx-auto w-full">
        <Link
          href="/kid"
          className="sketched-box marker-kid block px-4 py-5 relative self-start w-[92%]"
        >
          <div className="annotation absolute -top-4 left-5">FIG 1. THE {labels.listenerUpper}</div>
          <div className="panel-img-dashed h-32 mb-3">
            <svg viewBox="0 0 100 100" className="sketch-svg">
              <path d="M 15 60 Q 15 25, 50 25 Q 85 25, 85 60" />
              <rect x="8" y="55" width="16" height="26" rx="5" />
              <rect x="76" y="55" width="16" height="26" rx="5" />
              <path d="M 60 35 L 60 55 M 60 35 L 78 32 L 78 50" />
              <circle cx="58" cy="56" r="3.5" />
              <circle cx="76" cy="51" r="3.5" />
            </svg>
          </div>
          <div
            className={
              isFamily ? 'text-xl font-semibold' : 'font-display text-xl'
            }
          >
            I&rsquo;M THE{' '}
            <span className="marker-highlight kid">
              {labels.listenerUpper}
            </span>
          </div>
          <div className="text-sm font-bold mt-1">{labels.listenHint}</div>
          <div className="annotation ink absolute -bottom-5 right-3">TAP ME! &rarr;</div>
        </Link>

        <Link
          href="/parent"
          className="sketched-box marker-parent block px-4 py-5 relative self-end w-[92%]"
        >
          <div className="annotation absolute -top-4 left-5">FIG 2. THE {labels.storytellerUpper}</div>
          <div className="panel-img-dashed h-32 mb-3">
            <svg viewBox="0 0 100 100" className="sketch-svg">
              <rect x="40" y="18" width="20" height="38" rx="10" ry="10" />
              <path d="M 28 50 Q 28 70, 50 70 Q 72 70, 72 50" />
              <line x1="50" y1="70" x2="50" y2="86" />
              <line x1="35" y1="88" x2="65" y2="88" />
              <line x1="45" y1="30" x2="55" y2="30" />
              <line x1="45" y1="38" x2="55" y2="38" />
              <line x1="45" y1="46" x2="55" y2="46" />
            </svg>
          </div>
          <div
            className={
              isFamily ? 'text-xl font-semibold' : 'font-display text-xl'
            }
          >
            I&rsquo;M THE{' '}
            <span className="marker-highlight">{labels.storytellerUpper}</span>
          </div>
          <div className="text-sm font-bold mt-1">{labels.tellerHint}</div>
        </Link>
      </div>
    </div>
  );
}
