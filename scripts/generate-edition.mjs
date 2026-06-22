#!/usr/bin/env node
/**
 * The Chronicle — Daily Edition Generator
 * ----------------------------------------
 * 1. Fetches the day's top headlines from NewsData.io for four desks:
 *    India (national), World (international), Sports, and a rotating Feature.
 * 2. Asks Claude to pick the most important stories and rewrite them as
 *    original editorial prose, faithful to the source facts.
 * 3. Pulls live Delhi weather from open-meteo (no key required).
 * 4. Writes src/data/editions/<date>.json — which the site loads via glob.
 *
 * Usage:
 *   node scripts/generate-edition.mjs                 # generate today's edition
 *   node scripts/generate-edition.mjs --date=2026-06-23
 *   node scripts/generate-edition.mjs --dry-run       # fetch + print candidates only (no Claude call)
 *
 * Env (see .env.example):
 *   NEWSDATA_API_KEY   required
 *   ANTHROPIC_API_KEY  required (unless --dry-run)
 *   EDITION_MODEL      optional, default "claude-opus-4-8"
 *   EDITION_EFFORT     optional, default "medium" (low|medium|high)
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const EDITIONS_DIR = join(ROOT, "src", "data", "editions");

// ---------------------------------------------------------------------------
// Minimal .env loader (so local runs don't need a separate dotenv dependency).
// Does not override variables already present in the environment (CI wins).
// ---------------------------------------------------------------------------
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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv();

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const dateArg = args.find((a) => a.startsWith("--date="))?.split("=")[1];
const DATE = dateArg ?? new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const NEWSDATA_KEY = process.env.NEWSDATA_API_KEY;
const MODEL = process.env.EDITION_MODEL || "claude-opus-4-8";
const EFFORT = process.env.EDITION_EFFORT || "medium";

// The Feature desk rotates its category by day-of-week so the paper stays varied.
const FEATURE_ROTATION = ["science", "technology", "health", "science", "technology", "environment", "science"];
const featureCategory = FEATURE_ROTATION[new Date(DATE).getUTCDay()];

// Curated quotes on the press / news / history — rotated by day to avoid the
// model misattributing a fabricated quotation.
const QUOTES = [
  { text: "History is a set of lies agreed upon.", author: "Napoléon" },
  { text: "The press is the best instrument for enlightening the mind.", author: "Thomas Jefferson" },
  { text: "Journalism is the first rough draft of history.", author: "Philip L. Graham" },
  { text: "Whoever controls the media controls the mind.", author: "Jim Morrison" },
  { text: "The truth is rarely pure and never simple.", author: "Oscar Wilde" },
  { text: "Freedom of the press is not just important to democracy, it is democracy.", author: "Walter Cronkite" },
  { text: "To read a newspaper is to refrain from reading something worthwhile.", author: "Aleister Crowley" },
];

const NEWSDATA_BASE = "https://newsdata.io/api/1/latest";

const DESKS = [
  { key: "national", label: "India / National", params: { country: "in", category: "top", language: "en" } },
  { key: "international", label: "World / International", params: { category: "world", language: "en" } },
  { key: "sports", label: "Sports", params: { category: "sports", language: "en" } },
  { key: "feature", label: `Feature (${featureCategory})`, params: { category: featureCategory, language: "en" } },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function die(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/['’"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function readExistingSlugs() {
  if (!existsSync(EDITIONS_DIR)) return new Set();
  const slugs = new Set();
  for (const f of readdirSync(EDITIONS_DIR)) {
    if (!f.endsWith(".json") || f === `${DATE}.json`) continue;
    try {
      const ed = JSON.parse(readFileSync(join(EDITIONS_DIR, f), "utf8"));
      for (const a of ed.articles ?? []) slugs.add(a.slug);
    } catch { /* ignore malformed files */ }
  }
  return slugs;
}

function uniqueSlug(base, taken) {
  let slug = base || "article";
  let n = 2;
  while (taken.has(slug)) slug = `${base}-${n++}`;
  taken.add(slug);
  return slug;
}

function readMinutes(body) {
  const words = body.join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 200));
}

function daysSinceSeed() {
  const seed = Date.UTC(2026, 5, 22); // 2026-06-22, the first edition (No. 921)
  const cur = Date.UTC(Number(DATE.slice(0, 4)), Number(DATE.slice(5, 7)) - 1, Number(DATE.slice(8, 10)));
  return Math.round((cur - seed) / 86_400_000);
}

// ---------------------------------------------------------------------------
// NewsData.io
// ---------------------------------------------------------------------------
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
  // Try richest query first (reputable domains only), then progressively relax
  // so a parameter unsupported on the current NewsData plan can't break the run.
  const { country, category, language } = desk.params;
  const attempts = [
    { country, category, language, prioritydomain: "top" },
    { country, category, language },
    country ? { country, language } : { category, language },
  ];

  let results = null;
  let lastReason = "";
  for (const params of attempts) {
    const r = await requestNewsData(params);
    if (r.ok) { results = r.results; break; }
    lastReason = r.reason;
  }
  if (!results) die(`NewsData request for ${desk.label} failed: ${lastReason}`);

  // Dedupe near-identical headlines, drop entries without usable text.
  const seen = new Set();
  const out = [];
  for (const r of results) {
    if (!r.title || !(r.description || r.content)) continue;
    const key = normTitle(r.title);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: `${desk.key}-${out.length + 1}`,
      title: r.title,
      description: (r.description || r.content || "").slice(0, 600),
      source: r.source_name || r.source_id || "wire services",
      url: Array.isArray(r.link) ? r.link[0] : r.link || "",
      published: r.pubDate || "",
    });
    if (out.length >= 8) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// open-meteo (no key)
// ---------------------------------------------------------------------------
const WMO = {
  0: "Clear Skies", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime Fog", 51: "Light Drizzle", 53: "Drizzle", 55: "Heavy Drizzle",
  61: "Light Rain", 63: "Rain", 65: "Heavy Rain", 71: "Light Snow", 73: "Snow", 75: "Heavy Snow",
  80: "Rain Showers", 81: "Rain Showers", 82: "Violent Showers", 95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm",
};
async function fetchWeather() {
  try {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=28.61&longitude=77.21&current=temperature_2m,weather_code&timezone=Asia%2FKolkata";
    const res = await fetch(url);
    const json = await res.json();
    const t = Math.round(json.current.temperature_2m);
    const cond = WMO[json.current.weather_code] ?? "Clear Skies";
    return { temp: `${t}°C`, conditions: cond, city: "New Delhi" };
  } catch {
    return { temp: "—", conditions: "Clear Skies", city: "New Delhi" };
  }
}

// ---------------------------------------------------------------------------
// Claude rewrite
// ---------------------------------------------------------------------------
async function rewriteWithClaude(candidates) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const { zodOutputFormat } = await import("@anthropic-ai/sdk/helpers/zod");
  const { z } = await import("zod");

  if (!process.env.ANTHROPIC_API_KEY) die("ANTHROPIC_API_KEY is not set.");

  const ArticleOut = z.object({
    sourceId: z.string().describe("The id of the candidate headline this article is based on."),
    section: z.string().describe("Short desk label, e.g. 'Governance', 'Economy', 'Europe', 'Science'."),
    headline: z.string(),
    subhead: z.string().describe("One-sentence deck beneath the headline."),
    summary: z.string().describe("A 2-3 sentence standfirst for the front page."),
    author: z.string().describe("A plausible byline for a correspondent."),
    dateline: z.string().describe("Origin city in caps followed by an em dash, e.g. 'NEW DELHI —'."),
    body: z.array(z.string()).describe("4 to 6 paragraphs of editorial prose, ~120-180 words each."),
    pullQuote: z.string().describe("A short pull quote drawn from the piece, or empty string if none."),
  });
  const EditionOut = z.object({
    national: z.array(ArticleOut).describe("The TWO most important India stories."),
    international: z.array(ArticleOut).describe("The TWO most important world stories."),
    feature: ArticleOut.describe("ONE long-form feature."),
    sports: ArticleOut.describe("ONE sports story."),
  });

  const system = [
    "You are the editor of The Chronicle, a premium daily broadsheet in the tradition of the great print newspapers.",
    "You receive raw wire headlines for four desks. For each desk, pick the most consequential, newsworthy stories and rewrite them as original, elegant editorial prose.",
    "SELECTION RULES:",
    "- National: genuine Indian national affairs — government, policy, the economy, society, science, the courts. Ignore sport (it has its own desk), celebrity, horoscopes, and 'quote/lesson of the day' listicle filler. Pick the TWO most significant, on distinct subjects.",
    "- International: globally significant world affairs — geopolitics, conflict, diplomacy, the world economy, major society stories. Ignore celebrity gossip, entertainment and tabloid items entirely. Pick the TWO most significant, on distinct subjects.",
    "- Feature: the single most substantive, interesting story among the candidates; avoid product-deal posts, listings and aggregator spam.",
    "- Sports: the single most significant sporting result or story.",
    "If a desk's candidates are weak, choose the best available — never invent a story that is not among the candidates.",
    "STRICT FACTUALITY: rely only on the facts present in the supplied headline and description. Do NOT invent statistics, named sources, or direct quotations that are not in the source. A pull quote must paraphrase the article's own argument, not be presented as a real attributed quotation.",
    "VOICE: measured, literate, lightly formal British/Indian English. No clickbait, no hype, no emoji, no markdown. Write full, flowing paragraphs, not bullet points. Vary the bylines and datelines plausibly.",
  ].join("\n");

  const userPrompt =
    `Today is ${DATE}. Build today's edition from these candidate wire stories.\n\n` +
    JSON.stringify(candidates, null, 2) +
    `\n\nReturn the four desks. National and International each need exactly two stories; Feature and Sports need exactly one each. ` +
    `Set sourceId on every article to the id of the candidate you based it on. Give the Feature and the lead National story a pullQuote; others may use an empty string.`;

  const client = new Anthropic();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: EFFORT, format: zodOutputFormat(EditionOut, "edition") },
    system,
    messages: [{ role: "user", content: userPrompt }],
  });

  if (response.stop_reason === "refusal") die("Claude declined the request (refusal).");
  if (!response.parsed_output) die(`Model returned no parsable output (stop_reason: ${response.stop_reason}).`);
  return response.parsed_output;
}

// ---------------------------------------------------------------------------
// Assemble + write
// ---------------------------------------------------------------------------
function buildArticle(out, category, candidatesById, taken) {
  const src = candidatesById.get(out.sourceId);
  const body = (out.body || []).map((p) => p.trim()).filter(Boolean);
  const article = {
    id: out.sourceId,
    slug: uniqueSlug(slugify(out.headline), taken),
    category,
    section: out.section || category,
    headline: out.headline.trim(),
    subhead: out.subhead.trim(),
    summary: out.summary.trim(),
    author: out.author.trim(),
    readMinutes: readMinutes(body),
    dateISO: DATE,
    body,
    dateline: out.dateline?.trim() || undefined,
  };
  if (out.pullQuote && out.pullQuote.trim()) article.pullQuote = out.pullQuote.trim();
  if (src?.source) article.sourceName = src.source;
  if (src?.url) article.sourceUrl = src.url;
  return article;
}

async function main() {
  if (!NEWSDATA_KEY) die("NEWSDATA_API_KEY is not set. Add it to .env (see .env.example).");

  console.log(`\n📰 The Chronicle — generating edition for ${DATE}`);
  console.log(`   Feature desk today: ${featureCategory}\n`);

  // 1. Fetch candidates
  const candidatesBySlot = {};
  const candidatesById = new Map();
  for (const desk of DESKS) {
    process.stdout.write(`  • Fetching ${desk.label}… `);
    const list = await fetchDesk(desk);
    candidatesBySlot[desk.key] = list;
    list.forEach((c) => candidatesById.set(c.id, c));
    console.log(`${list.length} stories`);
  }

  const totals = Object.values(candidatesBySlot).reduce((n, l) => n + l.length, 0);
  if (totals < 4) die("Too few candidate stories returned from NewsData to build an edition.");

  if (DRY_RUN) {
    console.log("\n--- DRY RUN: candidate stories ---\n");
    for (const [slot, list] of Object.entries(candidatesBySlot)) {
      console.log(`### ${slot}`);
      list.forEach((c) => console.log(`  [${c.id}] ${c.title}  (${c.source})`));
      console.log("");
    }
    console.log("Dry run complete — no Claude call made, no file written.");
    return;
  }

  // 2. Rewrite with Claude
  console.log("\n  • Rewriting with Claude… (this can take a minute)");
  const out = await rewriteWithClaude(candidatesBySlot);

  // 3. Weather
  process.stdout.write("  • Fetching Delhi weather… ");
  const weather = await fetchWeather();
  console.log(`${weather.temp}, ${weather.conditions}`);

  // 4. Assemble — order defines front-page hierarchy:
  //    [lead national, national 2, intl 1, intl 2, feature, sports]
  const taken = readExistingSlugs();
  const national = (out.national || []).slice(0, 2);
  const international = (out.international || []).slice(0, 2);
  if (national.length < 2 || international.length < 2 || !out.feature || !out.sports) {
    die("Model did not return the required 2 national + 2 international + 1 feature + 1 sports.");
  }
  const articles = [
    buildArticle(national[0], "National", candidatesById, taken),
    buildArticle(national[1], "National", candidatesById, taken),
    buildArticle(international[0], "International", candidatesById, taken),
    buildArticle(international[1], "International", candidatesById, taken),
    buildArticle(out.feature, "Feature", candidatesById, taken),
    buildArticle(out.sports, "Sports", candidatesById, taken),
  ];

  const n = daysSinceSeed();
  const edition = {
    number: `${921 + n}-X`,
    volume: "CXIV",
    issue: `${42 + n}`,
    dateISO: DATE,
    weather,
    quote: QUOTES[new Date(DATE).getUTCDay() % QUOTES.length],
    articles,
  };

  if (!existsSync(EDITIONS_DIR)) mkdirSync(EDITIONS_DIR, { recursive: true });
  const outPath = join(EDITIONS_DIR, `${DATE}.json`);
  writeFileSync(outPath, JSON.stringify(edition, null, 2) + "\n");

  console.log(`\n✓ Wrote ${outPath}`);
  console.log(`  Edition No. ${edition.number} · ${articles.length} stories\n`);
  articles.forEach((a) => console.log(`  · [${a.category}] ${a.headline}`));
  console.log("");
}

main().catch((err) => die(err?.stack || String(err)));
