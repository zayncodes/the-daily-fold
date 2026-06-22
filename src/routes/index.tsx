import { createFileRoute, Link } from "@tanstack/react-router";
import { Masthead } from "@/components/Masthead";
import { Reveal } from "@/components/Reveal";
import { PageTransition, PageFooterNav, usePageNav, PageLink } from "@/components/PageChrome";
import { frontPageData, todaysEdition } from "@/lib/articles";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Chronicle — Today's Edition" },
      { name: "description", content: "Today's front page of The Chronicle: a ten-page daily newspaper across nation, world, business, science, sport and more." },
      { property: "og:title", content: "The Chronicle — Today's Edition" },
      { property: "og:description", content: "A ten-page daily newspaper, freshly set each morning." },
    ],
  }),
  component: FrontPage,
});

function FrontPage() {
  const ed = todaysEdition;
  const { lead, leadPage, teasers } = frontPageData(ed);
  const { swipe } = usePageNav(1);

  if (!lead || !leadPage) {
    return (
      <div className="min-h-screen mx-auto max-w-[1440px] px-6 md:px-10">
        <Masthead />
        <p className="py-20 text-center italic text-[color:var(--color-ink-soft)]">
          No edition has been published yet. Run the daily generator to set today's paper.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-paper)]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10" {...swipe}>
        <Masthead />

        <PageTransition pageKey={1}>
          <main className="grid grid-cols-12 gap-10 py-10">
            {/* Lead story */}
            <section className="col-span-12 lg:col-span-8 lg:border-r lg:pr-10 border-[color:var(--color-rule)]">
              <PageLink n={leadPage.n} className="block group">
                <div className="eyebrow mb-4">{lead.category} · {lead.section}</div>
                <h2 className="font-black tracking-tight text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.95] group-hover:opacity-90 transition-opacity">
                  {lead.headline}
                </h2>
                <p className="mt-6 text-lg md:text-2xl italic text-[color:var(--color-ink-soft)] max-w-3xl" style={{ fontFamily: "var(--font-serif)" }}>
                  {lead.subhead}
                </p>
              </PageLink>
              <div className="mt-6 flex items-center gap-4 meta">
                <span>By {lead.author}</span><span>·</span><span>{lead.readMinutes} min read</span>
              </div>

              <div className="mt-8 pt-8 border-t border-[color:var(--color-rule)] grid grid-cols-1 md:grid-cols-2 gap-8 text-[1.02rem] leading-[1.75]" style={{ fontFamily: "var(--font-serif)" }}>
                <p className="drop-cap">{lead.body[0]}</p>
                <div>
                  <p>{lead.body[1] ?? lead.summary}</p>
                  <PageLink n={leadPage.n} className="mt-4 inline-block meta link-underline">
                    Continued on Page {leadPage.n} →
                  </PageLink>
                </div>
              </div>
            </section>

            {/* What's Inside */}
            <aside className="col-span-12 lg:col-span-4">
              <div className="rule-double meta mb-5">What's Inside Today</div>
              <ul className="divide-y divide-[color:var(--color-rule)]">
                {teasers.map(({ page, article }, i) => (
                  <li key={page.n} className="py-4 first:pt-0">
                    <Reveal delay={i * 0.04}>
                      <PageLink n={page.n} className="block group">
                        <div className="meta flex items-center justify-between">
                          <span>{page.title}</span>
                          <span className="text-[color:var(--color-accent)]">Page {page.n}</span>
                        </div>
                        <h3 className="mt-1.5 text-xl leading-tight font-black tracking-tight group-hover:opacity-90">
                          {article.headline}
                        </h3>
                        <p className="mt-1.5 text-[0.92rem] leading-relaxed text-[color:var(--color-ink-soft)]" style={{ fontFamily: "var(--font-serif)" }}>
                          {article.summary}
                        </p>
                      </PageLink>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </aside>
          </main>
        </PageTransition>

        <PageFooterNav n={1} />

        <footer className="border-t border-[color:var(--color-ink)] py-10 mt-2 grid grid-cols-12 gap-6 meta">
          <div className="col-span-12 md:col-span-5">
            <div className="masthead text-2xl">The Chronicle</div>
            <p className="mt-2" style={{ fontFamily: "var(--font-serif)", textTransform: "none", letterSpacing: 0 }}>
              A ten-page daily, set afresh each morning by an editor that never sleeps.
            </p>
          </div>
          <div className="col-span-6 md:col-span-4">
            <div className="mb-2">Pages</div>
            <p style={{ textTransform: "none", letterSpacing: 0, fontFamily: "var(--font-serif)" }}>
              National · International · Metro · Business · Science · Sport · Features · Opinion · Living
            </p>
          </div>
          <div className="col-span-6 md:col-span-3">
            <div className="mb-2">Office</div>
            <p style={{ textTransform: "none", letterSpacing: 0, fontFamily: "var(--font-serif)" }}>
              No. 12, Press Lane,<br />New Delhi 110001
            </p>
          </div>
          <div className="col-span-12 border-t border-[color:var(--color-rule)] pt-4 flex flex-wrap justify-between gap-2">
            <span>© {new Date().getFullYear()} The Chronicle</span>
            <span>Set in Playfair Display, Lora & Inter</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
