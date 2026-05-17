'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TopNav() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b-2 border-ink/40 px-4 py-2 flex gap-2 justify-between items-center">
      <Link
        href="/"
        className="font-display text-base tracking-wide leading-none"
        aria-label="Home"
      >
        <span className="marker-highlight">STORY</span>
        <span className="ml-0.5">KEEPER</span>
      </Link>
      <div className="flex gap-3">
        {!isHome && (
          <Link href="/start" className="annotation hover:text-ink">
            SWITCH
          </Link>
        )}
        <Link href="/order" className="annotation hover:text-ink">
          ORDER
        </Link>
      </div>
    </nav>
  );
}
