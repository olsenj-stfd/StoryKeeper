import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 paper-grid gap-8">
      <div className="text-center max-w-md">
        <div className="font-display text-5xl leading-tight relative inline-block">
          <span className="marker-highlight">STORY</span>
          <br />
          KEEPER
        </div>
        <div className="annotation mt-4">stories from your parent, kept and continued</div>
      </div>

      <svg viewBox="0 0 200 90" className="sketch-svg w-48 h-24 mx-auto" aria-hidden="true">
        {/* open book sketch */}
        <path d="M 20 70 L 100 35 L 180 70 L 180 80 L 100 45 L 20 80 Z" />
        <path d="M 100 35 L 100 80" />
        <path d="M 30 60 L 60 50 M 30 67 L 60 57 M 30 74 L 60 64" strokeWidth="1.5" />
        <path d="M 140 50 L 170 60 M 140 57 L 170 67 M 140 64 L 170 74" strokeWidth="1.5" />
        {/* sparkles above */}
        <path d="M 100 18 L 100 28 M 95 23 L 105 23" strokeWidth="2" />
        <path d="M 70 12 L 70 18 M 67 15 L 73 15" strokeWidth="1.5" />
        <path d="M 130 14 L 130 20 M 127 17 L 133 17" strokeWidth="1.5" />
      </svg>

      <p className="font-bold text-center max-w-md leading-relaxed">
        Record stories for your kid even when you&rsquo;re away. They can listen back,
        pick what happens next, and one day print the whole adventure as a book.
      </p>

      <Link href="/start" className="sketched-btn marker-kid text-xl px-8 py-3">
        BEGIN &rarr;
      </Link>

      <div className="annotation">v.0.1 (prototype)</div>
    </div>
  );
}
