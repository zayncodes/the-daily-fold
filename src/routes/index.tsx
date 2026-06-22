import { createFileRoute, Link } from "@tanstack/react-router";
import { Masthead } from "@/components/Masthead";
import { Reveal } from "@/components/Reveal";
import { todaysEdition, type Article } from "@/lib/articles";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Chronicle — Today's Edition" },
      { name: "description", content: "Today's front page of The Chronicle: five curated stories across nation, world, ideas and sport." },
      { property: "og:title", content: "The Chronicle — Today's Edition" },
      { property: "og:description", content: "Five curated stories, freshly set each day." },
    ],
  }),
  component: FrontPage,
});

function FrontPage() {
  const ed = todaysEdition;
  const lead = ed.articles[0];
  const national2 = ed.articles[1];
  const intl1 = ed.articles[2];
  const intl2 = ed.articles[3];
  const feature = ed.articles[4];
  const sports = ed.articles[5];

  return (
    <div className="min-h-screen bg-[color:var(--color-paper)]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <Masthead />

        {/* Front page grid */}
        <main className="grid grid-cols-12 gap-8 py-10">
          {/* Lead story — left two columns */}
          <article id="national" className="col-span-12 md:col-span-7 border-r-0 md:border-r border-[color:var(--color-rule)] md:pr-8">
            <Link to="/article/$slug" params={{ slug: lead.slug }} className="block group">
              <div className="eyebrow mb-4">{lead.category} / {lead.section}</div>
              <h2 className="font-[var(--font-display)] text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.95] font-black tracking-tight group-hover:opacity-90 transition-opacity">
                {lead.headline}
              </h2>
              <p className="mt-6 text-lg md:text-xl italic text-[color:var(--color-ink-soft)] max-w-2xl" style={{ fontFamily: "var(--font-serif)" }}>
                {lead.subhead}
              </p>
              <div className="mt-8 flex items-center gap-4 meta">
                <span>By {lead.author}</span>
                <span>·</span>
                <span>{lead.readMinutes} min read</span>
              </div>
            </Link>

            <div className="mt-10 pt-8 border-t border-[color:var(--color-rule)] grid grid-cols-2 gap-8">
              <div>
                <p className="text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)] drop-cap">
                  {lead.summary}
                </p>
              </div>
              <div>
                <p className="text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
                  {lead.body[0]}
                </p>
                <Link
                  to="/article/$slug"
                  params={{ slug: lead.slug }}
                  className="mt-4 inline-block meta link-underline"
                >
                  Continue reading →
                </Link>
              </div>
            </div>
          </article>

          {/* Right column stack */}
          <aside className="col-span-12 md:col-span-5 space-y-8">
            <Reveal><FrontSnippet article={national2} /></Reveal>
            <Divider />
            <Reveal delay={0.08}><FrontSnippet article={intl1} /></Reveal>
            <Divider />
            <Reveal delay={0.16}><FrontSnippet article={intl2} /></Reveal>
          </aside>
        </main>

        {/* Below the fold */}
        <Reveal as="section" className="grid grid-cols-12 gap-8 border-t-[3px] border-double border-[color:var(--color-ink)] py-10">
          <article id="feature" className="col-span-12 md:col-span-7">
            <Link to="/article/$slug" params={{ slug: feature.slug }} className="block group">
              <div className="eyebrow mb-3">{feature.category} · {feature.section}</div>
              <h3 className="text-4xl md:text-5xl leading-tight font-black tracking-tight">
                {feature.headline}
              </h3>
              <p className="mt-4 italic text-[color:var(--color-ink-soft)] text-lg" style={{ fontFamily: "var(--font-serif)" }}>
                {feature.subhead}
              </p>
            </Link>
            <div className="mt-6 columns-1 md:columns-2 gap-8 [column-rule:1px_solid_var(--color-rule)]">
              <p className="text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)] drop-cap mb-4">
                {feature.body[0]}
              </p>
              <p className="text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)] mb-4">
                {feature.body[1]}
              </p>
              <Link to="/article/$slug" params={{ slug: feature.slug }} className="meta link-underline">
                Read the full feature →
              </Link>
            </div>
          </article>

          <article id="sports" className="col-span-12 md:col-span-5 md:border-l md:pl-8 border-[color:var(--color-rule)]">
            <div className="eyebrow mb-3">Sports</div>
            <Link to="/article/$slug" params={{ slug: sports.slug }} className="block group">
              <h3 className="text-3xl md:text-4xl leading-tight font-black tracking-tight">
                {sports.headline}
              </h3>
              <p className="mt-3 italic text-[color:var(--color-ink-soft)]" style={{ fontFamily: "var(--font-serif)" }}>
                {sports.subhead}
              </p>
            </Link>
            <p className="mt-5 text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
              {sports.summary}
            </p>
            <div className="mt-5 meta flex items-center gap-3">
              <span>By {sports.author}</span><span>·</span><span>{sports.readMinutes} min read</span>
            </div>
          </article>
        </Reveal>

        <Reveal as="footer" className="border-t border-[color:var(--color-ink)] py-10 mt-6 grid grid-cols-12 gap-6 meta">
          <div className="col-span-12 md:col-span-4">
            <div className="masthead text-2xl">The Chronicle</div>
            <p className="mt-2" style={{ fontFamily: "var(--font-serif)", textTransform: "none", letterSpacing: 0 }}>
              An independent daily, published in five carefully chosen stories.
            </p>
          </div>
          <div className="col-span-6 md:col-span-4">
            <div className="mb-2">Sections</div>
            <ul className="space-y-1" style={{ textTransform: "none", letterSpacing: 0, fontFamily: "var(--font-serif)" }}>
              <li>National</li><li>International</li><li>Features</li><li>Sports</li>
            </ul>
          </div>
          <div className="col-span-6 md:col-span-4">
            <div className="mb-2">Office</div>
            <p style={{ textTransform: "none", letterSpacing: 0, fontFamily: "var(--font-serif)" }}>
              No. 12, Press Lane,<br />New Delhi 110001
            </p>
          </div>
          <div className="col-span-12 border-t border-[color:var(--color-rule)] pt-4 flex justify-between">
            <span>© {new Date().getFullYear()} The Chronicle</span>
            <span>Set in Playfair Display, Lora & Inter</span>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-[color:var(--color-rule)]" />;
}

function FrontSnippet({ article }: { article: Article }) {
  return (
    <Link to="/article/$slug" params={{ slug: article.slug }} className="block group">
      <div className="eyebrow mb-2">{article.category} · {article.section}</div>
      <h3 className="text-2xl md:text-[1.7rem] leading-tight font-black tracking-tight group-hover:opacity-90">
        {article.headline}
      </h3>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
        {article.summary}
      </p>
      <div className="mt-3 meta flex gap-3">
        <span>{article.author}</span><span>·</span><span>{article.readMinutes} min read</span>
      </div>
    </Link>
  );
}
