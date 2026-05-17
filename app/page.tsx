import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10 paper-grid halftone-soft gap-8">
      <div className="text-center max-w-md">
        <div className="font-display text-5xl leading-tight relative inline-block">
          <span className="marker-highlight">STORY</span>
          <br />
          KEEPER
        </div>
        <div className="annotation mt-4">
          stories from your family, kept and continued
        </div>
      </div>

      <svg
        viewBox="0 0 200 90"
        className="sketch-svg w-44 h-20 mx-auto"
        aria-hidden="true"
      >
        <path d="M 20 70 L 100 35 L 180 70 L 180 80 L 100 45 L 20 80 Z" />
        <path d="M 100 35 L 100 80" />
        <path d="M 30 60 L 60 50 M 30 67 L 60 57 M 30 74 L 60 64" strokeWidth="1.5" />
        <path d="M 140 50 L 170 60 M 140 57 L 170 67 M 140 64 L 170 74" strokeWidth="1.5" />
        <path d="M 100 18 L 100 28 M 95 23 L 105 23" strokeWidth="2" />
        <path d="M 70 12 L 70 18 M 67 15 L 73 15" strokeWidth="1.5" />
        <path d="M 130 14 L 130 20 M 127 17 L 133 17" strokeWidth="1.5" />
      </svg>

      <div className="annotation ink text-center">PICK YOUR MODE</div>

      <div className="flex flex-col gap-10 max-w-md mx-auto w-full">
        <Link
          href="/start?mode=bedtime"
          className="sketched-box marker-kid block px-5 py-5 relative self-start w-[94%]"
        >
          <div className="annotation absolute -top-4 left-5">MODE 1.</div>
          <div className="font-display text-2xl mb-1">
            <span className="marker-highlight kid">BEDTIME</span>
          </div>
          <div className="text-sm font-bold leading-relaxed">
            For kids. Mom or Dad records a bedtime story; the kid picks what
            happens next, hears it back, and the story grows over time.
          </div>
          <div className="annotation ink absolute -bottom-5 right-3">TAP ME! &rarr;</div>
        </Link>

        <Link
          href="/start?mode=family"
          className="sketched-box marker-mint block px-5 py-5 relative self-end w-[94%]"
        >
          <div className="annotation absolute -top-4 left-5">MODE 2.</div>
          <div className="font-display text-2xl mb-1">
            <span className="marker-highlight mint">FAMILY</span> STORYKEEPER
          </div>
          <div className="text-sm font-bold leading-relaxed">
            Keep your family&rsquo;s treasured stories. Record grandparents,
            siblings, aunts &amp; uncles. Index people, places, and themes
            across generations.
          </div>
        </Link>
      </div>

      <div className="annotation">v.0.1 (prototype)</div>
    </div>
  );
}
