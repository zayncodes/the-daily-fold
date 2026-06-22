import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Masthead } from "@/components/Masthead";
import { Reveal } from "@/components/Reveal";
import { editions, formatLongDate } from "@/lib/articles";

export const Route = createFileRoute("/archive")({
  head: () => ({
    meta: [
      { title: "Archive — The Chronicle" },
      { name: "description", content: "Browse and search previous editions of The Chronicle." },
      { property: "og:title", content: "Archive — The Chronicle" },
      { property: "og:description", content: "Browse and search previous editions of The Chronicle." },
    ],
  }),
  component: ArchivePage,
});

function ArchivePage() {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return null;
    const hits: { edition: string; slug: string; headline: string; category: string; date: string }[] = [];
    for (const ed of editions) {
      for (const a of ed.articles) {
        if (
          a.headline.toLowerCase().includes(term) ||
          a.section.toLowerCase().includes(term) ||
          a.category.toLowerCase().includes(term) ||
          ed.dateISO.includes(term)
        ) {
          hits.push({ edition: ed.number, slug: a.slug, headline: a.headline, category: `${a.category} · ${a.section}`, date: ed.dateISO });
        }
      }
    }
    return hits;
  }, [q]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <Masthead compact />

        <section className="py-12">
          <div className="eyebrow mb-3">The Archive</div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">Previous Editions</h1>
          <p className="mt-4 max-w-2xl italic text-lg text-[color:var(--color-ink-soft)]" style={{ fontFamily: "var(--font-serif)" }}>
            A complete record of The Chronicle, set day by day. Browse the covers, or search by headline, topic or date.
          </p>

          <div className="mt-8 max-w-xl">
            <label className="meta block mb-2">Search the archive</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Try ‘rupee’, ‘sports’, or ‘2026-06’"
              className="w-full border-b-2 border-[color:var(--color-ink)] bg-transparent py-3 text-xl focus:outline-none placeholder:text-[color:var(--color-ink-soft)] placeholder:italic"
              style={{ fontFamily: "var(--font-serif)" }}
            />
          </div>
        </section>

        {results ? (
          <section className="border-t border-[color:var(--color-ink)] py-10">
            <div className="meta mb-6">{results.length} result{results.length === 1 ? "" : "s"} for “{q}”</div>
            <ul className="divide-y divide-[color:var(--color-rule)]">
              {results.map((r, i) => (
                <li key={i} className="py-5 grid grid-cols-12 gap-4">
                  <div className="col-span-12 md:col-span-3 meta">
                    {formatLongDate(r.date)}<br />Ed. {r.edition}
                  </div>
                  <div className="col-span-12 md:col-span-9">
                    <div className="eyebrow mb-1">{r.category}</div>
                    <Link to="/article/$slug" params={{ slug: r.slug }} className="text-xl md:text-2xl font-black tracking-tight link-underline">
                      {r.headline}
                    </Link>
                  </div>
                </li>
              ))}
              {results.length === 0 && <li className="py-6 italic text-[color:var(--color-ink-soft)]">No matching dispatches found.</li>}
            </ul>
          </section>
        ) : (
          <section className="border-t border-[color:var(--color-ink)] py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {editions.map((ed, i) => (
              <Reveal as="article" key={ed.number} delay={i * 0.06} className="paper-card border border-[color:var(--color-rule)] p-6 flex flex-col">
                <div className="meta flex justify-between">
                  <span>Vol. {ed.volume} · No. {ed.issue}</span>
                  <span>Ed. {ed.number}</span>
                </div>
                <div className="mt-4 text-center border-y border-[color:var(--color-ink)] py-4">
                  <div className="masthead text-2xl md:text-3xl">The Chronicle</div>
                  <div className="meta mt-2">{formatLongDate(ed.dateISO)}</div>
                </div>
                <h3 className="mt-5 text-xl font-black tracking-tight leading-snug">
                  {ed.articles[0].headline}
                </h3>
                <p className="mt-2 text-sm italic text-[color:var(--color-ink-soft)]" style={{ fontFamily: "var(--font-serif)" }}>
                  {ed.articles[0].subhead}
                </p>
                <div className="mt-auto pt-5">
                  <Link to="/article/$slug" params={{ slug: ed.articles[0].slug }} className="meta link-underline">
                    Open this edition →
                  </Link>
                </div>
              </Reveal>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
