import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { Masthead } from "@/components/Masthead";
import { ReadingProgress } from "@/components/ReadingProgress";
import { useSwipe } from "@/hooks/use-swipe";
import {
  formatLongDate,
  getArticleBySlug,
  getArticleNeighbors,
} from "@/lib/articles";

export const Route = createFileRoute("/article/$slug")({
  head: ({ params }) => {
    const a = getArticleBySlug(params.slug);
    const title = a ? `${a.headline} — The Chronicle` : "The Chronicle";
    const desc = a?.subhead ?? "An article from The Chronicle.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
      ],
    };
  },
  loader: ({ params }) => {
    const article = getArticleBySlug(params.slug);
    if (!article) throw notFound();
    return { article };
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="eyebrow mb-2">404</div>
        <h1 className="text-4xl font-black">Article not found</h1>
        <Link to="/" className="mt-4 inline-block link-underline meta">Return to front page</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <h1 className="text-2xl font-black">This page didn't load</h1>
        <p className="mt-2 meta">{error.message}</p>
        <Link to="/" className="mt-4 inline-block link-underline meta">Return to front page</Link>
      </div>
    </div>
  ),
  component: ArticlePage,
});

function ArticlePage() {
  const { article } = Route.useLoaderData();
  const { prev, next, index, total } = getArticleNeighbors(article.slug);
  const navigate = useNavigate();

  const goTo = (slug?: string) => slug && navigate({ to: "/article/$slug", params: { slug } });
  const swipe = useSwipe(() => goTo(next?.slug), () => goTo(prev?.slug));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && next) {
        navigate({ to: "/article/$slug", params: { slug: next.slug } });
      } else if (e.key === "ArrowLeft" && prev) {
        navigate({ to: "/article/$slug", params: { slug: prev.slug } });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, navigate]);

  return (
    <div className="min-h-screen">
      <ReadingProgress />
      <div className="mx-auto max-w-[1440px] px-6 md:px-10" {...swipe}>
        <Masthead compact />

        {/* Page indicator */}
        <div className="flex items-center justify-between py-4 meta border-b border-[color:var(--color-rule)]">
          <span>Page {index + 1} of {total} · {article.category}</span>
          <span>{formatLongDate(article.dateISO)}</span>
        </div>

        <article
          key={article.slug}
          className="animate-unfold py-12 grid grid-cols-12 gap-8 page-fold"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Headline block */}
          <header className="col-span-12 text-center max-w-4xl mx-auto">
            <div className="eyebrow mb-4">{article.section}</div>
            <h1 className="font-black tracking-tight text-[clamp(2.4rem,5.5vw,5rem)] leading-[0.95]">
              {article.headline}
            </h1>
            <p className="mt-6 italic text-xl md:text-2xl text-[color:var(--color-ink-soft)]" style={{ fontFamily: "var(--font-serif)" }}>
              {article.subhead}
            </p>
            <div className="mt-8 flex items-center justify-center gap-4 meta">
              <span>By {article.author}</span>
              <span>·</span>
              <span>{article.readMinutes} min read</span>
              <span>·</span>
              <span>{formatLongDate(article.dateISO)}</span>
            </div>
          </header>

          {/* Body in columns */}
          <div className="col-span-12 mt-6 border-t-[3px] border-double border-[color:var(--color-ink)] pt-10">
            <div className="columns-1 md:columns-2 lg:columns-3 gap-10 [column-rule:1px_solid_var(--color-rule)] text-[1.02rem] leading-[1.75] text-[color:var(--color-ink)]" style={{ fontFamily: "var(--font-serif)" }}>
              {article.dateline && (
                <p className="mb-5">
                  <span className="meta mr-2">{article.dateline}</span>
                </p>
              )}
              {article.body.map((p: string, i: number) => (
                <p key={i} className={`mb-5 ${i === 0 ? "drop-cap" : ""}`}>
                  {p}
                </p>
              ))}
              {article.pullQuote && (
                <blockquote className="my-8 break-inside-avoid border-y border-[color:var(--color-ink)] py-6 text-2xl italic font-medium leading-snug text-center" style={{ fontFamily: "var(--font-display)" }}>
                  "{article.pullQuote}"
                </blockquote>
              )}
            </div>
          </div>

          {article.sourceName && (
            <div className="col-span-12 mt-2 meta">
              Source:{" "}
              {article.sourceUrl ? (
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline"
                >
                  {article.sourceName}
                </a>
              ) : (
                article.sourceName
              )}
            </div>
          )}
        </article>

        {/* Page-turn navigation */}
        <nav className="border-t border-[color:var(--color-ink)] py-8 grid grid-cols-2 gap-6">
          <div>
            {prev && (
              <Link to="/article/$slug" params={{ slug: prev.slug }} className="block group">
                <div className="meta mb-2">← Previous Page</div>
                <div className="text-xl md:text-2xl font-black tracking-tight group-hover:opacity-80">
                  {prev.headline}
                </div>
              </Link>
            )}
          </div>
          <div className="text-right">
            {next && (
              <Link to="/article/$slug" params={{ slug: next.slug }} className="block group">
                <div className="meta mb-2">Next Page →</div>
                <div className="text-xl md:text-2xl font-black tracking-tight group-hover:opacity-80">
                  {next.headline}
                </div>
              </Link>
            )}
          </div>
        </nav>

        <div className="border-t border-[color:var(--color-rule)] py-6 text-center meta">
          <Link to="/" className="link-underline">Return to Front Page</Link>
        </div>
      </div>
    </div>
  );
}
