import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { Masthead } from "@/components/Masthead";
import { ReadingProgress } from "@/components/ReadingProgress";
import { ArticleBody } from "@/components/ArticleBody";
import { PageTransition, PageLink } from "@/components/PageChrome";
import { useSwipe } from "@/hooks/use-swipe";
import {
  formatLongDate,
  getArticleBySlug,
  getArticleNeighbors,
  getPageForSlug,
  type Article,
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
  const { article } = Route.useLoaderData() as { article: Article };
  const { prev, next } = getArticleNeighbors(article.slug);
  const ctx = getPageForSlug(article.slug);
  const navigate = useNavigate();

  const goTo = (slug?: string) => slug && navigate({ to: "/article/$slug", params: { slug } });
  const swipe = useSwipe(() => goTo(next?.slug), () => goTo(prev?.slug));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(next?.slug);
      else if (e.key === "ArrowLeft") goTo(prev?.slug);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next, prev]);

  return (
    <div className="min-h-screen">
      <ReadingProgress />
      <div className="mx-auto max-w-[1120px] px-6 md:px-10" {...swipe}>
        <Masthead compact />

        <div className="flex items-center justify-between py-4 meta border-b border-[color:var(--color-rule)]">
          <span>
            {ctx?.page ? (
              <PageLink n={ctx.page.n} className="link-underline">
                {ctx.page.title} · Page {ctx.page.n}
              </PageLink>
            ) : (
              article.category
            )}
          </span>
          <span>{formatLongDate(article.dateISO)}</span>
        </div>

        <PageTransition pageKey={article.slug}>
          <article className="py-12">
            <ArticleBody article={article} lead centered columnsClass="md:columns-2 lg:columns-3" />
          </article>
        </PageTransition>

        <nav className="border-t border-[color:var(--color-ink)] py-8 grid grid-cols-2 gap-6">
          <div>
            {prev && (
              <Link to="/article/$slug" params={{ slug: prev.slug }} className="block group">
                <div className="meta mb-2">← Previous Story</div>
                <div className="text-xl md:text-2xl font-black tracking-tight group-hover:opacity-80">{prev.headline}</div>
              </Link>
            )}
          </div>
          <div className="text-right">
            {next && (
              <Link to="/article/$slug" params={{ slug: next.slug }} className="block group">
                <div className="meta mb-2">Next Story →</div>
                <div className="text-xl md:text-2xl font-black tracking-tight group-hover:opacity-80">{next.headline}</div>
              </Link>
            )}
          </div>
        </nav>

        <div className="border-t border-[color:var(--color-rule)] py-6 text-center meta flex items-center justify-center gap-4">
          {ctx?.page && (
            <PageLink n={ctx.page.n} className="link-underline">Back to {ctx.page.title}</PageLink>
          )}
          <span aria-hidden="true">·</span>
          <Link to="/" className="link-underline">Front Page</Link>
        </div>
      </div>
    </div>
  );
}
