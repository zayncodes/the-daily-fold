export type Category =
  | "National"
  | "International"
  | "Feature"
  | "Sports";

export type Article = {
  id: string;
  slug: string;
  category: Category;
  section: string; // sub-label e.g. "Governance"
  headline: string;
  subhead: string;
  summary: string;
  author: string;
  readMinutes: number;
  dateISO: string; // publication date
  body: string[]; // paragraphs
  pullQuote?: string;
  dateline?: string; // e.g. NEW DELHI —
  sourceName?: string; // attribution: originating outlet
  sourceUrl?: string; // attribution: link to original report
};

export type Edition = {
  number: string;       // e.g. "921-X"
  volume: string;       // e.g. "CXIV"
  issue: string;        // e.g. "42"
  dateISO: string;      // edition date
  weather: { temp: string; conditions: string; city: string };
  quote: { text: string; author: string };
  articles: Article[];
};

// Load every dated edition file at build time. Each new edition committed by
// the daily content engine (scripts/generate-edition.mjs) is picked up here
// automatically on the next build — no manual wiring required.
const editionModules = import.meta.glob<{ default: Edition }>(
  "../data/editions/*.json",
  { eager: true },
);

export const editions: Edition[] = Object.values(editionModules)
  .map((m) => m.default)
  // newest first, so editions[0] is always the latest published day
  .sort((a, b) => (a.dateISO < b.dateISO ? 1 : a.dateISO > b.dateISO ? -1 : 0));

// "Today" is whatever the most recent published edition is. This is robust to
// the cron not having run yet on a given calendar day.
export const todaysEdition: Edition =
  editions[0] ?? {
    number: "—",
    volume: "—",
    issue: "—",
    dateISO: new Date().toISOString().slice(0, 10),
    weather: { temp: "—", conditions: "—", city: "New Delhi" },
    quote: { text: "The press is the best instrument for enlightening the mind.", author: "Thomas Jefferson" },
    articles: [],
  };

export function getEditionByDate(dateISO: string): Edition | undefined {
  return editions.find((e) => e.dateISO === dateISO);
}

/** Find the edition that contains a given article slug. */
export function getEditionBySlug(slug: string): Edition | undefined {
  return editions.find((e) => e.articles.some((a) => a.slug === slug));
}

export function getArticleBySlug(slug: string): Article | undefined {
  for (const ed of editions) {
    const a = ed.articles.find((x) => x.slug === slug);
    if (a) return a;
  }
  return undefined;
}

/**
 * Previous/next neighbours within the SAME edition as the article, so that
 * paging works correctly whether the reader opened today's paper or an
 * archived one. Wraps around the edition's article list.
 */
export function getArticleNeighbors(slug: string) {
  const edition = getEditionBySlug(slug) ?? todaysEdition;
  const list = edition.articles;
  const idx = list.findIndex((a) => a.slug === slug);
  if (idx === -1) return { prev: undefined, next: undefined, index: -1, total: list.length };
  return {
    prev: list.length > 1 ? list[(idx - 1 + list.length) % list.length] : undefined,
    next: list.length > 1 ? list[(idx + 1) % list.length] : undefined,
    index: idx,
    total: list.length,
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
