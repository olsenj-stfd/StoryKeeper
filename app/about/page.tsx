import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="flex-1 px-5 py-8 max-w-2xl w-full mx-auto paper-grid">
      <header className="mb-8 pb-3 border-b border-dashed border-ink/40">
        <div className="annotation">STORYKEEPER &middot; ABOUT</div>
        <h1 className="font-display text-3xl mt-2 leading-tight">
          Why we built <span className="marker-highlight">STORYKEEPER</span>
        </h1>
      </header>

      <section className="mb-8 space-y-3 font-bold leading-relaxed">
        <p>
          For families separated by work &mdash; military deployments, pilots on
          long-haul rotations, consultants on the road, traveling nurses &mdash;
          the nightly bedtime story disappears. That ritual isn&rsquo;t just a
          routine. It&rsquo;s one of the most studied, most emotionally important
          experiences in early childhood.
        </p>
        <p>
          StoryKeeper keeps it going. The parent records when they can; the kid
          listens, picks what happens next, and over time the story becomes a
          keepsake &mdash; eventually a real printed book.
        </p>
      </section>

      <section className="mb-8">
        <div className="annotation ink mb-3">WHAT THE RESEARCH SAYS</div>

        <div className="sketched-box marker-mint p-5 mb-5 relative">
          <div className="annotation absolute -top-4 left-5">FIG 1.</div>
          <div className="font-display text-lg mb-1">
            A parent&rsquo;s <span className="marker-highlight mint">VOICE</span> is doing real biological work.
          </div>
          <p className="text-sm leading-relaxed">
            A landmark 2010 study at the University of Wisconsin&ndash;Madison
            (Seltzer, Ziegler &amp; Pollak, <em>Proc. R. Soc. B</em>) showed
            that when girls in a stressful situation heard their mother&rsquo;s
            voice &mdash; even by phone &mdash; their cortisol dropped and
            oxytocin rose nearly the same as if mom were in the room. Text
            messages did not produce the effect. The parent&rsquo;s voice
            itself is the medicine.
          </p>
        </div>

        <div className="sketched-box marker-kid p-5 mb-5 relative">
          <div className="annotation absolute -top-4 left-5">FIG 2.</div>
          <div className="font-display text-lg mb-1">
            Reading aloud is a <span className="marker-highlight kid">load-bearing</span> childhood ritual.
          </div>
          <p className="text-sm leading-relaxed">
            The American Academy of Pediatrics formally recommends reading aloud
            from infancy through elementary school. Decades of research
            (Trelease, Whitehurst, others) show measurable, compounding gains
            in vocabulary, literacy, and parent&ndash;child bonding for kids
            who hear their parents read aloud regularly.
          </p>
        </div>

        <div className="sketched-box marker-coral p-5 mb-5 relative">
          <div className="annotation absolute -top-4 left-5">FIG 3.</div>
          <div className="font-display text-lg mb-1">
            Parental absence has a real cost &mdash; and rituals soften it.
          </div>
          <p className="text-sm leading-relaxed">
            Studies of military families (RAND, Military Family Research
            Institute) show parental separation measurably affects emotional
            regulation, behavior, and school performance, and the effect
            compounds with each tour. Pre-departure rituals that travel with
            the child &mdash; recordings, letters, voice messages &mdash; meaningfully
            mitigate this.
          </p>
        </div>

        <div className="sketched-box marker-parent p-5 relative">
          <div className="annotation absolute -top-4 left-5">FIG 4.</div>
          <div className="font-display text-lg mb-1">
            <span className="marker-highlight">PROOF</span> already exists.
          </div>
          <p className="text-sm leading-relaxed">
            United Through Reading (founded 1989) has helped deployed military
            parents record themselves reading books to their kids for over
            three decades, reaching hundreds of thousands of children. Letters
            from those kids &mdash; read out at homecomings &mdash; make the case
            better than any paper. StoryKeeper builds on that same insight,
            with two additions: stories that branch and continue so the kid
            has agency, and a long-term archive so the stories become a
            keepsake.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <div className="annotation ink mb-3">WHAT WE&rsquo;RE NOT</div>
        <div className="bg-white border-2 border-ink/60 rounded-xl p-5">
          <p className="font-bold leading-relaxed">
            We are not an AI parent. AI never speaks as Mom or Dad. AI helps
            the parent on the back end &mdash; drafting branch ideas when
            they&rsquo;re tired, indexing characters across stories, building
            printable books &mdash; but the voice the kid hears is always the
            real one.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <div className="annotation ink mb-2">FURTHER READING</div>
        <ul className="text-sm space-y-1.5 leading-snug">
          <li>
            &middot; Seltzer LJ, Ziegler TE, Pollak SD. &ldquo;Social vocalizations
            can release oxytocin in humans.&rdquo; <em>Proc. R. Soc. B</em>,
            2010.
          </li>
          <li>
            &middot; American Academy of Pediatrics. <em>Literacy Promotion: An
            Essential Component of Primary Care Pediatric Practice.</em> 2014,
            reaffirmed 2018.
          </li>
          <li>
            &middot; Trelease J. <em>The Read-Aloud Handbook.</em>
          </li>
          <li>
            &middot; United Through Reading.{' '}
            <a
              href="https://unitedthroughreading.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              unitedthroughreading.org
            </a>
          </li>
        </ul>
      </section>

      <div className="flex gap-3 flex-wrap">
        <Link href="/start" className="sketched-btn marker-kid">
          BEGIN &rarr;
        </Link>
        <Link href="/" className="annotation hover:text-ink self-center">
          &larr; BACK HOME
        </Link>
      </div>
    </div>
  );
}
