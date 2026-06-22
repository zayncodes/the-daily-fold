import type { Article } from "@/lib/articles";
import { formatLongDate } from "@/lib/articles";

/**
 * Renders a full article: header (kicker, headline, deck, byline) and a
 * columned, drop-capped body with an optional pull quote and source line.
 * Used both on section pages (left-aligned, 2 columns) and in the focused
 * reading view (centred header, 3 columns).
 */
export function ArticleBody({
  article,
  lead = false,
  centered = false,
  columnsClass = "md:columns-2",
  showMeta = true,
}: {
  article: Article;
  lead?: boolean;
  centered?: boolean;
  columnsClass?: string;
  showMeta?: boolean;
}) {
  const headlineSize = lead
    ? "text-[clamp(2.2rem,5vw,4.2rem)] leading-[0.98]"
    : "text-3xl md:text-4xl leading-tight";

  return (
    <div>
      <header className={centered ? "text-center max-w-4xl mx-auto" : ""}>
        <div className="eyebrow mb-3">
          {article.category}
          {article.section ? ` · ${article.section}` : ""}
        </div>
        <h2 className={`font-black tracking-tight ${headlineSize}`}>{article.headline}</h2>
        {article.subhead && (
          <p
            className={`mt-4 italic text-[color:var(--color-ink-soft)] ${lead ? "text-xl md:text-2xl" : "text-lg"}`}
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {article.subhead}
          </p>
        )}
        {showMeta && (
          <div className={`mt-5 flex flex-wrap items-center gap-3 meta ${centered ? "justify-center" : ""}`}>
            <span>By {article.author}</span>
            <span>·</span>
            <span>{article.readMinutes} min read</span>
            <span>·</span>
            <span>{formatLongDate(article.dateISO)}</span>
          </div>
        )}
      </header>

      <div
        className={`mt-7 pt-7 border-t border-[color:var(--color-rule)] columns-1 ${columnsClass} gap-9 [column-rule:1px_solid_var(--color-rule)] text-[1.02rem] leading-[1.75] text-[color:var(--color-ink)]`}
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {article.body.map((p, i) => (
          <p key={i} className={`mb-5 ${i === 0 ? "drop-cap" : ""}`}>
            {i === 0 && article.dateline ? (
              <span className="font-semibold">{article.dateline} </span>
            ) : null}
            {p}
          </p>
        ))}

        {article.pullQuote && (
          <blockquote
            className="my-8 break-inside-avoid border-y border-[color:var(--color-ink)] py-6 text-2xl italic font-medium leading-snug text-center"
            style={{ fontFamily: "var(--font-display)" }}
          >
            “{article.pullQuote}”
          </blockquote>
        )}

        {article.sourceName && (
          <p className="meta mt-2 break-inside-avoid">
            Source:{" "}
            {article.sourceUrl ? (
              <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="link-underline">
                {article.sourceName}
              </a>
            ) : (
              article.sourceName
            )}
          </p>
        )}
      </div>
    </div>
  );
}
