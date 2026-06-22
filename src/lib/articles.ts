// ---------------------------------------------------------------------------
// The Chronicle — data model
//
// An edition is a 10-page newspaper. Page 1 (the Front Page) is *derived* in
// code as an index/teaser into the other pages, so only pages 2..10 are stored.
// Each stored page carries long-form articles plus "extras" (quizzes, facts,
// puzzles, reviews, weather, …) rendered alongside them.
// ---------------------------------------------------------------------------

export type Article = {
  id: string;
  slug: string;
  category: string; // page/section name, e.g. "National News"
  section: string; // small kicker, e.g. "Governance"
  headline: string;
  subhead: string;
  summary: string;
  author: string;
  readMinutes: number;
  dateISO: string;
  body: string[];
  pullQuote?: string;
  dateline?: string; // e.g. "NEW DELHI —"
  sourceName?: string;
  sourceUrl?: string;
};

// Extras are a discriminated union; the <Extras> renderer maps each to a card.
export type Extra =
  | { type: "funfact"; title?: string; text: string }
  | { type: "quote"; text: string; author: string }
  | { type: "onthisday"; entries: { year: string; text: string }[] }
  | { type: "quiz"; question: string; options?: string[]; answer: string; note?: string }
  | { type: "puzzle"; kind: "Riddle" | "Anagram" | "Lateral"; prompt: string; answer: string }
  | { type: "review"; medium: "Book" | "Film"; title: string; creator: string; rating?: number; text: string }
  | { type: "healthtip"; title?: string; text: string }
  | { type: "weather"; city: string; temp: string; conditions: string }
  | { type: "factcheck"; claim: string; verdict: string; explanation: string }
  | { type: "letter"; author: string; city?: string; text: string }
  | { type: "markets"; items: { name: string; value: string; change: string }[] }
  | { type: "standings"; title: string; rows: { name: string; detail: string }[] };

export type PageKind = "news" | "opinion" | "miscellany";

export type Page = {
  n: number; // 2..10
  slug: string;
  title: string;
  kind: PageKind;
  articles: Article[];
  extras: Extra[];
};

export type Edition = {
  number: string;
  volume: string;
  issue: string;
  dateISO: string;
  weather: { temp: string; conditions: string; city: string };
  quote: { text: string; author: string };
  pages: Page[]; // stored pages, n = 2..10
};

// Metadata for all ten pages (front page included). Drives navigation, the
// page strip, and the "What's Inside" index. Keep in sync with the engine.
export const PAGE_META: { n: number; slug: string; title: string; kind: PageKind | "front" }[] = [
  { n: 1, slug: "front", title: "Front Page", kind: "front" },
  { n: 2, slug: "national", title: "National News", kind: "news" },
  { n: 3, slug: "international", title: "International", kind: "news" },
  { n: 4, slug: "local", title: "State & Metro", kind: "news" },
  { n: 5, slug: "business", title: "Business & Economy", kind: "news" },
  { n: 6, slug: "science-tech", title: "Science & Technology", kind: "news" },
  { n: 7, slug: "sports", title: "Sports", kind: "news" },
  { n: 8, slug: "features", title: "Features & Human Interest", kind: "news" },
  { n: 9, slug: "opinion", title: "Opinion & Editorials", kind: "opinion" },
  { n: 10, slug: "miscellany", title: "Facts, Lifestyle & Living", kind: "miscellany" },
];

export const TOTAL_PAGES = 10;

// --- Load every edition file at build time --------------------------------
const editionModules = import.meta.glob<{ default: Edition }>(
  "../data/editions/*.json",
  { eager: true },
);

export const editions: Edition[] = Object.values(editionModules)
  .map((m) => m.default)
  .sort((a, b) => (a.dateISO < b.dateISO ? 1 : a.dateISO > b.dateISO ? -1 : 0));

export const todaysEdition: Edition =
  editions[0] ?? {
    number: "—",
    volume: "—",
    issue: "—",
    dateISO: new Date().toISOString().slice(0, 10),
    weather: { temp: "—", conditions: "—", city: "New Delhi" },
    quote: { text: "The press is the best instrument for enlightening the mind.", author: "Thomas Jefferson" },
    pages: [],
  };

// --- Helpers ---------------------------------------------------------------
export function getEditionByDate(dateISO: string): Edition | undefined {
  return editions.find((e) => e.dateISO === dateISO);
}

export function getPage(edition: Edition, n: number): Page | undefined {
  return edition.pages.find((p) => p.n === n);
}

/** All articles in an edition, in page order (front-page derivations excluded). */
export function getAllArticles(edition: Edition): Article[] {
  return edition.pages.flatMap((p) => p.articles);
}

export function getEditionBySlug(slug: string): Edition | undefined {
  return editions.find((e) => getAllArticles(e).some((a) => a.slug === slug));
}

export function getArticleBySlug(slug: string): Article | undefined {
  for (const ed of editions) {
    const a = getAllArticles(ed).find((x) => x.slug === slug);
    if (a) return a;
  }
  return undefined;
}

/** The page (2..10) that contains a given article slug, within its edition. */
export function getPageForSlug(slug: string): { edition: Edition; page: Page } | undefined {
  for (const ed of editions) {
    for (const p of ed.pages) {
      if (p.articles.some((a) => a.slug === slug)) return { edition: ed, page: p };
    }
  }
  return undefined;
}

/** Previous/next article within the same edition (flattened, in page order). */
export function getArticleNeighbors(slug: string) {
  const edition = getEditionBySlug(slug) ?? todaysEdition;
  const list = getAllArticles(edition);
  const idx = list.findIndex((a) => a.slug === slug);
  if (idx === -1) return { prev: undefined, next: undefined, index: -1, total: list.length };
  return {
    prev: idx > 0 ? list[idx - 1] : undefined,
    next: idx < list.length - 1 ? list[idx + 1] : undefined,
    index: idx,
    total: list.length,
  };
}

/** Previous/next page numbers for the 10-page flip nav. */
export function pageNeighbors(n: number) {
  return {
    prev: n > 1 ? n - 1 : undefined,
    next: n < TOTAL_PAGES ? n + 1 : undefined,
  };
}

/** Front-page composition: a lead plus one teaser per content page. */
export function frontPageData(edition: Edition) {
  const teasers = edition.pages
    .filter((p) => p.articles.length > 0)
    .map((p) => ({ page: p, article: p.articles[0] }));
  return {
    lead: teasers[0]?.article,
    leadPage: teasers[0]?.page,
    teasers: teasers.slice(1),
  };
}

export function formatLongDate(isoDate: string) {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
