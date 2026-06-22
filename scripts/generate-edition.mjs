#!/usr/bin/env node
/**
 * The Chronicle — Daily Edition Generator (10-page)
 * -------------------------------------------------
 * Builds a full ten-page newspaper:
 *   - Pages 2-8 (news): top headlines from NewsData.io for National, World,
 *     State/Metro, Business, Science & Tech, Sports and Features, each
 *     rewritten by Claude into long-form editorial articles + extras.
 *   - Page 9 (Opinion): an AI-authored editorial, a guest column and letters.
 *   - Page 10 (Miscellany): AI-authored facts, a quiz, a puzzle, reviews,
 *     a health tip, a fact-check + live Delhi weather (open-meteo).
 * The Front Page (page 1) is derived in the app, so it is not generated here.
 *
 * Usage:
 *   node scripts/generate-edition.mjs                 # today's edition
 *   node scripts/generate-edition.mjs --date=2026-06-23
 *   node scripts/generate-edition.mjs --dry-run       # fetch + print candidates only
 *
 * Env (see .env.example): NEWSDATA_API_KEY, ANTHROPIC_API_KEY,
 *   EDITION_MODEL (default claude-opus-4-8), EDITION_EFFORT (default medium).
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const EDITIONS_DIR = join(ROOT, "src", "data", "editions");

// --- .env loader (no dependency) ------------------------------------------
function loadEnv() {
  const envPath = join(ROOT, ".env");
  if (!existsSync(envPath)) return;
  for (const raw of readFileSync(envPath, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv();

// --- args / config ---------------------------------------------------------
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const dateArg = args.find((a) => a.startsWith("--date="))?.split("=")[1];
const DATE = dateArg ?? new Date().toISOString().slice(0, 10);

const NEWSDATA_KEY = process.env.NEWSDATA_API_KEY;
const MODEL = process.env.EDITION_MODEL || "claude-opus-4-8";
const EFFORT = process.env.EDITION_EFFORT || "medium";
const NEWSDATA_BASE = "https://newsdata.io/api/1/latest";

const QUOTES = [
  { text: "History is a set of lies agreed upon.", author: "Napoléon" },
  { text: "The press is the best instrument for enlightening the mind.", author: "Thomas Jefferson" },
  { text: "Journalism is the first rough draft of history.", author: "Philip L. Graham" },
  { text: "The truth is rarely pure and never simple.", author: "Oscar Wilde" },
  { text: "Freedom of the press is not just important to democracy, it is democracy.", author: "Walter Cronkite" },
  { text: "A free press can be good or bad, but a press without freedom is never anything but bad.", author: "Albert Camus" },
  { text: "Knowledge will forever govern ignorance.", author: "James Madison" },
];

// The seven news desks (pages 2-8).
const NEWS_DESKS = [
  { n: 2, slug: "national", title: "National News", params: { country: "in", category: "top" },
    focus: "Indian national affairs of consequence: government, policy, the economy, society, the courts, national science. Avoid sport (it has its own desk) and celebrity trivia." },
  { n: 3, slug: "international", title: "International", params: { category: "world" },
    focus: "globally significant world affairs: geopolitics, conflict, diplomacy, the world economy, major society stories. Avoid celebrity gossip and entertainment." },
  { n: 4, slug: "local", title: "State & Metro", params: { country: "in", q: "Delhi OR Mumbai OR Bengaluru OR Chennai OR Kolkata OR Hyderabad" },
    focus: "Indian city and state news: infrastructure, civic governance, transport, education, housing, community stories in the metros." },
  { n: 5, slug: "business", title: "Business & Economy", params: { category: "business" },
    focus: "business and the economy: markets, companies, startups, jobs, inflation, industry trends, personal finance." },
  { n: 6, slug: "science-tech", title: "Science & Technology", params: { category: "technology" },
    focus: "science and technology: research, AI, space, computing, health science, innovation." },
  { n: 7, slug: "sports", title: "Sports", params: { category: "sports" },
    focus: "sport: the most significant results, athletes, leagues and upcoming events." },
  { n: 8, slug: "features", title: "Features & Human Interest", params: { category: "lifestyle" },
    focus: "human interest, culture, travel, the environment, social issues and inspiring stories." },
];

// --- helpers ---------------------------------------------------------------
function die(msg) { console.error(`\n✗ ${msg}\n`); process.exit(1); }

function slugify(s) {
  return s.toLowerCase().replace(/['’"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}
function readMinutes(body) {
  const words = body.join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 200));
}
function daysSinceSeed() {
  const seed = Date.UTC(2026, 5, 22);
  const cur = Date.UTC(Number(DATE.slice(0, 4)), Number(DATE.slice(5, 7)) - 1, Number(DATE.slice(8, 10)));
  return Math.round((cur - seed) / 86_400_000);
}
function makeSlugger() {
  const taken = new Set();
  if (existsSync(EDITIONS_DIR)) {
    for (const f of readdirSync(EDITIONS_DIR)) {
      if (!f.endsWith(".json") || f === `${DATE}.json`) continue;
      try {
        const ed = JSON.parse(readFileSync(join(EDITIONS_DIR, f), "utf8"));
        for (const p of ed.pages ?? []) for (const a of p.articles ?? []) taken.add(a.slug);
      } catch { /* ignore */ }
    }
  }
  return (base) => {
    let slug = base || "article", k = 2;
    while (taken.has(slug)) slug = `${base}-${k++}`;
    taken.add(slug);
    return slug;
  };
}
async function mapPool(items, limit, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx); }
    }),
  );
  return out;
}

// --- NewsData --------------------------------------------------------------
async function requestNewsData(params) {
  const url = new URL(NEWSDATA_BASE);
  url.searchParams.set("apikey", NEWSDATA_KEY);
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (res.ok && json.status === "success") return { ok: true, results: json.results ?? [] };
  return { ok: false, reason: json?.results?.message || json?.message || `HTTP ${res.status}` };
}
const normTitle = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 60);

async function fetchDesk(desk) {
  const base = { ...desk.params, language: desk.params.language || "en" };
  const attempts = [
    { ...base, prioritydomain: "top" },
    base,
    base.country ? { country: base.country, language: "en" } : { category: base.category, language: "en" },
  ];
  let results = null, lastReason = "";
  for (const params of attempts) {
    const r = await requestNewsData(params);
    if (r.ok) { results = r.results; break; }
    lastReason = r.reason;
  }
  if (!results) die(`NewsData request for ${desk.title} failed: ${lastReason}`);

  const seen = new Set();
  const out = [];
  for (const r of results) {
    if (!r.title || !(r.description || r.content)) continue;
    const key = normTitle(r.title);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: `${desk.slug}-${out.length + 1}`,
      title: r.title,
      description: (r.description || r.content || "").slice(0, 600),
      source: r.source_name || r.source_id || "wire services",
      url: Array.isArray(r.link) ? r.link[0] : r.link || "",
    });
    if (out.length >= 8) break;
  }
  return out;
}

// --- open-meteo ------------------------------------------------------------
const WMO = { 0: "Clear Skies", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast", 45: "Fog", 48: "Rime Fog", 51: "Light Drizzle", 53: "Drizzle", 55: "Heavy Drizzle", 61: "Light Rain", 63: "Rain", 65: "Heavy Rain", 71: "Light Snow", 73: "Snow", 75: "Heavy Snow", 80: "Rain Showers", 81: "Rain Showers", 82: "Violent Showers", 95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm" };
async function fetchWeather() {
  try {
    const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=28.61&longitude=77.21&current=temperature_2m,weather_code&timezone=Asia%2FKolkata");
    const j = await res.json();
    return { temp: `${Math.round(j.current.temperature_2m)}°C`, conditions: WMO[j.current.weather_code] ?? "Clear Skies", city: "New Delhi" };
  } catch { return { temp: "—", conditions: "Clear Skies", city: "New Delhi" }; }
}

// --- Claude ----------------------------------------------------------------
let _client, _z, _zof;
async function ai() {
  if (_client) return { client: _client, z: _z, zof: _zof };
  if (!process.env.ANTHROPIC_API_KEY) die("ANTHROPIC_API_KEY is not set.");
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  ({ zodOutputFormat: _zof } = await import("@anthropic-ai/sdk/helpers/zod"));
  ({ z: _z } = await import("zod"));
  _client = new Anthropic();
  return { client: _client, z: _z, zof: _zof };
}
async function callClaude(system, user, schema, name) {
  const { client } = await ai();
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await client.messages.parse({
        model: MODEL,
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        output_config: { effort: EFFORT, format: _zof(schema, name) },
        system,
        messages: [{ role: "user", content: user }],
      });
      if (res.stop_reason === "refusal") throw new Error("model refusal");
      if (!res.parsed_output) throw new Error(`no parsable output (${res.stop_reason})`);
      return res.parsed_output;
    } catch (err) {
      if (attempt === 2) throw err;
      console.warn(`    retry (${name}): ${err.message}`);
    }
  }
}

const VOICE =
  "Voice: measured, literate, lightly formal British/Indian English. No clickbait, hype, emoji or markdown. Full flowing paragraphs. " +
  "STRICT FACTUALITY: rely only on facts present in the supplied material; never invent statistics, named sources or attributed quotations. A pull quote must paraphrase the piece's own argument, not pose as a real quotation.";

function articleSchema(z) {
  return z.object({
    sourceId: z.string().describe("id of the candidate this article is based on"),
    section: z.string().describe("short kicker, e.g. 'Governance', 'Markets'"),
    headline: z.string(),
    subhead: z.string(),
    summary: z.string().describe("2-3 sentence standfirst"),
    author: z.string().describe("a plausible correspondent byline"),
    dateline: z.string().describe("ORIGIN CITY followed by em dash, e.g. 'NEW DELHI —'"),
    body: z.array(z.string()).describe("8 to 12 full paragraphs, ~150-220 words each"),
    pullQuote: z.string().describe("a short pull quote, or empty string"),
  });
}

async function genNewsPage(desk, candidates) {
  const { z } = await ai();
  const Schema = z.object({
    articles: z.array(articleSchema(z)).describe("the TWO most important stories for this desk"),
    funfact: z.object({ title: z.string(), text: z.string() }),
    quote: z.object({ text: z.string(), author: z.string() }),
  });
  const system = [
    `You are the ${desk.title} editor of The Chronicle, a premium daily broadsheet.`,
    `Select the two most important stories for this desk and rewrite each as a long, substantial editorial article (8-12 paragraphs).`,
    `Desk focus: ${desk.focus}`,
    `If candidates are weak, choose the best available; never invent a story not among the candidates.`,
    `Also supply one genuinely interesting 'fun fact' related to the desk's theme, and one apt, real, famous quotation.`,
    VOICE,
  ].join(" ");
  const user = `Today is ${DATE}. Candidate wire stories for the ${desk.title} desk:\n\n${JSON.stringify(candidates, null, 2)}\n\nSet sourceId on each article to the candidate it draws from.`;
  return callClaude(system, user, Schema, "news_page");
}

async function genOpinion(headlines) {
  const { z } = await ai();
  const Col = z.object({
    section: z.string(),
    headline: z.string(),
    subhead: z.string(),
    summary: z.string(),
    author: z.string(),
    body: z.array(z.string()).describe("5 to 8 paragraphs"),
    pullQuote: z.string(),
  });
  const Schema = z.object({
    editorial: Col.describe("the unsigned leader; author should be 'The Editorial Board'"),
    column: Col.describe("a signed guest column with a named author"),
    letters: z.array(z.object({ author: z.string(), city: z.string(), text: z.string() })).describe("2-3 letters to the editor"),
    quote: z.object({ text: z.string(), author: z.string() }),
  });
  const system = [
    "You are the opinion editor of The Chronicle.",
    "Write a leader (editorial) and one signed guest column reflecting thoughtfully on the day's news; then compose two or three short, civil letters to the editor responding to the day's stories.",
    "These are opinion pieces and may argue a view, but must remain factually grounded in the headlines provided and invent no statistics.",
    VOICE,
  ].join(" ");
  const user = `Today is ${DATE}. The day's leading headlines across the paper:\n\n${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}`;
  return callClaude(system, user, Schema, "opinion");
}

async function genMiscellany() {
  const { z } = await ai();
  const Schema = z.object({
    lifestyle: z.object({
      section: z.string(), headline: z.string(), subhead: z.string(), summary: z.string(),
      author: z.string(), body: z.array(z.string()).describe("3 to 5 paragraphs"), pullQuote: z.string(),
    }),
    funfacts: z.array(z.object({ title: z.string(), text: z.string() })).describe("two fun facts"),
    quiz: z.object({ question: z.string(), options: z.array(z.string()), answer: z.string(), note: z.string() }),
    puzzle: z.object({ kind: z.enum(["Riddle", "Anagram", "Lateral"]), prompt: z.string(), answer: z.string() }),
    reviews: z.array(z.object({ medium: z.enum(["Book", "Film"]), title: z.string(), creator: z.string(), rating: z.number(), text: z.string() })).describe("one classic book and one classic film, evergreen"),
    healthtip: z.object({ title: z.string(), text: z.string() }),
    factcheck: z.object({ claim: z.string(), verdict: z.string(), explanation: z.string() }),
    onthisday: z.array(z.object({ year: z.string(), text: z.string() })).describe("three real historical events"),
  });
  const system = [
    "You are the features & lifestyle editor of The Chronicle, composing the back page.",
    "Produce a short lifestyle/living piece plus a lively set of extras: two fun facts, a quick quiz (with four options and the correct answer), a puzzle, one classic book review and one classic film review (evergreen, genuinely well-known works), a health tip, a fact-check of a common myth, and three real 'on this day' historical events.",
    "Everything must be factually accurate; reviews should be of real, famous works. No invented facts.",
    VOICE,
  ].join(" ");
  return callClaude(system, `Compose the back page for ${DATE}.`, Schema, "miscellany");
}

// --- assembly --------------------------------------------------------------
function toArticle(out, deskTitle, candidatesById, slugger) {
  const body = (out.body || []).map((p) => p.trim()).filter(Boolean);
  const src = out.sourceId ? candidatesById.get(out.sourceId) : undefined;
  const a = {
    id: out.sourceId || slugify(out.headline).slice(0, 12),
    slug: slugger(slugify(out.headline)),
    category: deskTitle,
    section: out.section || deskTitle,
    headline: out.headline.trim(),
    subhead: (out.subhead || "").trim(),
    summary: (out.summary || "").trim(),
    author: (out.author || "Staff Correspondent").trim(),
    readMinutes: readMinutes(body),
    dateISO: DATE,
    body,
  };
  if (out.dateline && out.dateline.trim()) a.dateline = out.dateline.trim();
  if (out.pullQuote && out.pullQuote.trim()) a.pullQuote = out.pullQuote.trim();
  if (src?.source) a.sourceName = src.source;
  if (src?.url) a.sourceUrl = src.url;
  return a;
}

async function main() {
  if (!NEWSDATA_KEY) die("NEWSDATA_API_KEY is not set. Add it to .env (see .env.example).");
  console.log(`\n📰 The Chronicle — generating the ${DATE} edition (10 pages)\n`);

  // 1. Fetch all news desks
  const candidatesByDesk = {};
  for (const desk of NEWS_DESKS) {
    process.stdout.write(`  • Fetching ${desk.title}… `);
    candidatesByDesk[desk.slug] = await fetchDesk(desk);
    console.log(`${candidatesByDesk[desk.slug].length} stories`);
  }

  if (DRY_RUN) {
    console.log("\n--- DRY RUN: candidate stories ---");
    for (const desk of NEWS_DESKS) {
      console.log(`\n### ${desk.title}`);
      candidatesByDesk[desk.slug].forEach((c) => console.log(`  [${c.id}] ${c.title}  (${c.source})`));
    }
    console.log("\nDry run complete — no Claude call made, no file written.");
    return;
  }

  const slugger = makeSlugger();
  const pages = [];

  // 2. News pages 2-8 (Claude, limited concurrency)
  console.log("\n  • Writing news pages with Claude (this takes a few minutes)…");
  const newsResults = await mapPool(NEWS_DESKS, 3, async (desk) => {
    const cands = candidatesByDesk[desk.slug];
    if (!cands.length) { console.warn(`    ! ${desk.title}: no candidates, skipping`); return null; }
    const byId = new Map(cands.map((c) => [c.id, c]));
    try {
      const out = await genNewsPage(desk, cands);
      console.log(`    ✓ ${desk.title}`);
      return { desk, out, byId };
    } catch (err) {
      console.warn(`    ! ${desk.title}: ${err.message} — skipping page`);
      return null;
    }
  });

  const leadHeadlines = [];
  for (const r of newsResults) {
    if (!r) continue;
    const articles = (r.out.articles || []).slice(0, 2).map((a) => toArticle(a, r.desk.title, r.byId, slugger));
    if (!articles.length) continue;
    leadHeadlines.push(`${r.desk.title}: ${articles[0].headline}`);
    pages.push({
      n: r.desk.n, slug: r.desk.slug, title: r.desk.title, kind: "news",
      articles,
      extras: [
        { type: "funfact", title: r.out.funfact?.title || "Fun Fact", text: r.out.funfact?.text || "" },
        { type: "quote", text: r.out.quote?.text || "", author: r.out.quote?.author || "" },
      ].filter((e) => e.text),
    });
  }

  // 3. Opinion (page 9) + Miscellany (page 10) + weather, in parallel
  console.log("  • Writing Opinion and the back page…");
  const [opinion, misc, weather] = await Promise.all([
    genOpinion(leadHeadlines.length ? leadHeadlines : ["A quiet news day across the desks."]).catch((e) => { console.warn(`    ! Opinion: ${e.message}`); return null; }),
    genMiscellany().catch((e) => { console.warn(`    ! Miscellany: ${e.message}`); return null; }),
    fetchWeather(),
  ]);

  if (opinion) {
    pages.push({
      n: 9, slug: "opinion", title: "Opinion & Editorials", kind: "opinion",
      articles: [
        toArticle({ ...opinion.editorial, author: "The Editorial Board", dateline: "" }, "Opinion", new Map(), slugger),
        toArticle({ ...opinion.column, dateline: "" }, "Opinion", new Map(), slugger),
      ],
      extras: [
        ...(opinion.letters || []).map((l) => ({ type: "letter", author: l.author, city: l.city, text: l.text })),
        ...(opinion.quote?.text ? [{ type: "quote", text: opinion.quote.text, author: opinion.quote.author }] : []),
      ],
    });
  }

  if (misc) {
    pages.push({
      n: 10, slug: "miscellany", title: "Facts, Lifestyle & Living", kind: "miscellany",
      articles: [toArticle({ ...misc.lifestyle, dateline: "" }, "Lifestyle", new Map(), slugger)],
      extras: [
        ...(misc.funfacts || []).map((f) => ({ type: "funfact", title: f.title, text: f.text })),
        { type: "quiz", question: misc.quiz.question, options: misc.quiz.options, answer: misc.quiz.answer, note: misc.quiz.note },
        { type: "puzzle", kind: misc.puzzle.kind, prompt: misc.puzzle.prompt, answer: misc.puzzle.answer },
        ...(misc.reviews || []).map((r) => ({ type: "review", medium: r.medium, title: r.title, creator: r.creator, rating: r.rating, text: r.text })),
        { type: "healthtip", title: misc.healthtip.title, text: misc.healthtip.text },
        { type: "factcheck", claim: misc.factcheck.claim, verdict: misc.factcheck.verdict, explanation: misc.factcheck.explanation },
        { type: "onthisday", entries: misc.onthisday || [] },
        { type: "weather", city: weather.city, temp: weather.temp, conditions: weather.conditions },
      ],
    });
  }

  pages.sort((a, b) => a.n - b.n);
  if (pages.length < 4) die("Too few pages were generated to publish an edition.");

  // 4. Assemble + write
  const nDays = daysSinceSeed();
  const edition = {
    number: `${921 + nDays}-X`,
    volume: "CXIV",
    issue: `${42 + nDays}`,
    dateISO: DATE,
    weather,
    quote: QUOTES[new Date(DATE).getUTCDay() % QUOTES.length],
    pages,
  };

  if (!existsSync(EDITIONS_DIR)) mkdirSync(EDITIONS_DIR, { recursive: true });
  const outPath = join(EDITIONS_DIR, `${DATE}.json`);
  writeFileSync(outPath, JSON.stringify(edition, null, 2) + "\n");

  const totalArticles = pages.reduce((n, p) => n + p.articles.length, 0);
  console.log(`\n✓ Wrote ${outPath}`);
  console.log(`  Edition No. ${edition.number} · ${pages.length} pages · ${totalArticles} articles\n`);
  for (const p of pages) console.log(`  Page ${p.n}  ${p.title}  (${p.articles.length} articles, ${p.extras.length} extras)`);
  console.log("");
}

main().catch((err) => die(err?.stack || String(err)));
