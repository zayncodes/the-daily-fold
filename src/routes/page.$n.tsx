import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { Masthead } from "@/components/Masthead";
import { ReadingProgress } from "@/components/ReadingProgress";
import { ArticleBody } from "@/components/ArticleBody";
import { Extras } from "@/components/Extras";
import {
  PageTransition,
  PageFooterNav,
  usePageNav,
  metaFor,
} from "@/components/PageChrome";
import {
  formatLongDate,
  getPage,
  todaysEdition,
  TOTAL_PAGES,
  type Page,
} from "@/lib/articles";

export const Route = createFileRoute("/page/$n")({
  head: ({ params }) => {
    const meta = metaFor(Number(params.n));
    const title = meta ? `${meta.title} — The Chronicle` : "The Chronicle";
    return {
      meta: [
        { title },
        { name: "description", content: `Page ${params.n} of The Chronicle: ${meta?.title ?? ""}.` },
        { property: "og:title", content: title },
      ],
    };
  },
  loader: ({ params }) => {
    const n = Number(params.n);
    if (n === 1) throw redirect({ to: "/" });
    if (!Number.isInteger(n) || n < 2 || n > TOTAL_PAGES) throw notFound();
    const page = getPage(todaysEdition, n);
    if (!page) throw notFound();
    return { page, n };
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="eyebrow mb-2">No such page</div>
        <Link to="/" className="link-underline meta">Return to the Front Page</Link>
      </div>
    </div>
  ),
  component: SectionPage,
});

function SectionPage() {
  const { page, n } = Route.useLoaderData() as { page: Page; n: number };
  const { swipe } = usePageNav(n);

  return (
    <div className="min-h-screen">
      <ReadingProgress />
      <div className="mx-auto max-w-[1440px] px-6 md:px-10" {...swipe}>
        <Masthead compact />

        {/* Section header */}
        <div className="flex flex-wrap items-end justify-between gap-3 border-b-[3px] border-double border-[color:var(--color-ink)] pb-3 pt-6">
          <h2 className="masthead text-3xl md:text-5xl">{page.title}</h2>
          <div className="meta text-right">
            <div>Page {n} of {TOTAL_PAGES}</div>
            <div className="mt-1">{formatLongDate(todaysEdition.dateISO)}</div>
          </div>
        </div>

        <PageTransition pageKey={n}>
          <PageContent page={page} />
        </PageTransition>

        <PageFooterNav n={n} />

        <div className="border-t border-[color:var(--color-rule)] py-6 text-center meta">
          <Link to="/" className="link-underline">Return to Front Page</Link>
        </div>
      </div>
    </div>
  );
}

function PageContent({ page }: { page: Page }) {
  // Miscellany: the extras are the main event.
  if (page.kind === "miscellany") {
    return (
      <div className="py-10">
        {page.articles.length > 0 && (
          <div className="max-w-3xl mx-auto mb-12">
            {page.articles.map((a) => (
              <ArticleBody key={a.slug} article={a} columnsClass="md:columns-2" />
            ))}
          </div>
        )}
        <Extras items={page.extras} layout="grid" />
      </div>
    );
  }

  // News & opinion: articles in a main column, extras in the margin.
  return (
    <div className="grid grid-cols-12 gap-10 py-10">
      <div className="col-span-12 lg:col-span-8 space-y-12">
        {page.articles.map((a, i) => (
          <article key={a.slug} className={i > 0 ? "border-t border-[color:var(--color-rule)] pt-10" : ""}>
            <ArticleBody article={a} lead={i === 0} columnsClass="md:columns-2" />
            <Link
              to="/article/$slug"
              params={{ slug: a.slug }}
              className="mt-5 inline-block meta link-underline"
            >
              Open this story →
            </Link>
          </article>
        ))}
      </div>
      <aside className="col-span-12 lg:col-span-4">
        <div className="lg:sticky lg:top-6">
          <Extras items={page.extras} layout="aside" />
        </div>
      </aside>
    </div>
  );
}
