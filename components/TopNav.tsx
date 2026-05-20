'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TopNav() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  const linkClass = (active: boolean) =>
    `annotation ink px-2 py-1 rounded-full transition ${
      active ? 'bg-yellow border-2 border-ink' : 'opacity-70 hover:opacity-100'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-[3px] border-ink px-4 py-2 flex gap-2 justify-between items-center">
      <Link
        href="/"
        className="text-sm font-display font-bold tracking-wide leading-none"
        aria-label="Moonjar Stories home"
      >
        MOONJAR STORIES
      </Link>
      <div className="flex gap-1 items-center">
        <Link
          href="/"
          className={linkClass(isHome)}
          aria-current={isHome ? 'page' : undefined}
        >
          <span aria-hidden="true">🏠 </span>HOME
        </Link>
        {!isHome && (
          <Link
            href="/start"
            className={linkClass(pathname === '/start')}
          >
            SWITCH
          </Link>
        )}
        <Link
          href="/about"
          className={linkClass(pathname === '/about')}
        >
          ABOUT
        </Link>
        <Link
          href="/order"
          className={linkClass(pathname === '/order')}
        >
          ORDER
        </Link>
      </div>
    </nav>
  );
}
