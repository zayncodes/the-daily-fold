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

const TODAY = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const offset = (days: number) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - days);
  return iso(d);
};

const todayArticles: Article[] = [
  {
    id: "a1",
    slug: "monsoon-surplus-deccan",
    category: "National",
    section: "Governance",
    headline: "Monsoon Surplus: Infrastructure Resilience in the Deccan Plateau",
    subhead:
      "New architectural standards for flood-resilient urban centres are tested as record rainfall hits the southern states.",
    summary:
      "As the southwest monsoon delivers a fifteen-percent surplus across the plateau, civic engineers in Hyderabad, Pune and Bengaluru are quietly rewriting the rulebook on porous pavement, drainage easements and elevated transit corridors.",
    author: "Arundhati Iyer",
    readMinutes: 8,
    dateISO: iso(TODAY),
    dateline: "HYDERABAD —",
    pullQuote:
      "The plateau is no longer engineered for the rain it received; it is engineered for the rain it will.",
    body: [
      "Long before the first cloudburst arrived this season, the city of Hyderabad had begun replacing kilometres of impervious paving with permeable basalt aggregate. The intervention, modest in cost and almost invisible to the pedestrian, has produced one of the year's quietest infrastructural victories: a thirty-eight percent reduction in flash flooding across the old quarter.",
      "Civic engineers describe the work in the cautious language of a profession unaccustomed to public attention. \"We are not solving the monsoon,\" said municipal commissioner Ravi Menon. \"We are giving it somewhere to go.\" The remark, delivered over a desk strewn with hydrological charts, captures a shift in posture among India's urban planners — from resistance to accommodation.",
      "Across the Deccan, the philosophy is taking architectural form. In Pune, elevated transit corridors now double as catchment surfaces, channelling runoff into newly excavated retention basins beneath public parks. In Bengaluru, the long-derelict Bellandur lake has been re-engineered as the centrepiece of a stormwater commons, its banks softened with native sedge and reinforced with woven jute.",
      "Critics caution that the visible work obscures harder questions. Land tenure, encroachment, and the political economy of construction permits remain unresolved. Yet for the millions who once dreaded the season, the early data suggests a city that is, at last, listening to the rain.",
      "The coming weeks will test these interventions against the heaviest forecasts in a decade. If the plateau holds, it will not be because the monsoon was tamed — but because, for the first time in a generation, it was finally understood.",
    ],
  },
  {
    id: "a2",
    slug: "parliament-data-bill",
    category: "National",
    section: "Politics",
    headline: "Data Protection Bill Returns to Parliament Amid Industry Pushback",
    subhead:
      "Revised provisions on cross-border transfers reopen a debate the government had hoped was settled.",
    summary:
      "The redrafted legislation, two years in the making, introduces stricter penalties for breach disclosure while loosening consent norms for state agencies — a compromise satisfying neither civil society nor the technology sector.",
    author: "Vikram Sharma",
    readMinutes: 6,
    dateISO: iso(TODAY),
    dateline: "NEW DELHI —",
    body: [
      "The Personal Data Protection Bill, in its third public iteration, arrived in the Lok Sabha this week to a chamber that has come to treat the document with weary familiarity. The latest draft, circulated late on Tuesday evening, contains nineteen substantive changes from the version tabled in the winter session.",
      "Most significant is the recalibration of cross-border data transfer rules. Where the previous draft had permitted transfer to a curated list of jurisdictions, the new text reverses the presumption: all transfers are allowed unless specifically restricted. Industry bodies, which had lobbied intensely for the change, greeted it with measured approval.",
      "Yet the same draft sharpens penalties for failure to disclose breaches, raising the ceiling from fifteen to fifty crore rupees, and extends the disclosure window from seventy-two hours to forty-eight. \"It is a bill that asks more of companies and offers less to citizens,\" said advocate Apar Gupta, founder of the Internet Freedom Foundation.",
      "The legislation is expected to be referred to a parliamentary standing committee before its second reading. Few in the chamber expect that the third draft will be the last.",
    ],
  },
  {
    id: "a3",
    slug: "rupee-resilience-corridor",
    category: "International",
    section: "Economy",
    headline: "The Rupee's Resilience in a Shifting Global Corridor",
    subhead:
      "Bilateral trade agreements with emerging markets strengthen domestic currency against western volatility.",
    summary:
      "While the dollar wavers under recalibrated Federal Reserve guidance, a quiet web of rupee-denominated trade settlements with Russia, the UAE and Indonesia has begun to anchor the currency in unexpected ways.",
    author: "V. Sharma",
    readMinutes: 5,
    dateISO: iso(TODAY),
    dateline: "MUMBAI —",
    body: [
      "The rupee closed the week at 82.4 against the dollar, a level that would have seemed implausible eighteen months ago. The currency's stability, analysts now agree, is not the product of intervention but of architecture.",
      "Since 2024, the Reserve Bank has quietly negotiated rupee-settlement protocols with twenty-three trading partners. The agreements, modest individually, have begun to compound. Roughly eleven percent of India's bilateral trade now bypasses the dollar entirely — a figure that would have read as ideological a decade ago and reads as pragmatic today.",
      "The implications extend beyond the trading floor. Indian exporters report shorter settlement cycles; importers, narrower hedging costs. For the central bank, the architecture provides a buffer against the kind of currency contagion that has lately rattled emerging markets from Ankara to Buenos Aires.",
      "Not all observers are sanguine. The arrangements depend on a delicate balance of trade with each partner, and persistent surpluses or deficits could destabilise the framework. For now, however, the rupee's quiet confidence is a story worth telling slowly.",
    ],
  },
  {
    id: "a4",
    slug: "eurozone-policy-shift",
    category: "International",
    section: "Europe",
    headline: "Eurozone Policy Shift: Implications for Asian Trade",
    subhead:
      "The European Central Bank's pivot toward sustained tightening reverberates across export-dependent economies from Seoul to Singapore.",
    summary:
      "An unexpectedly hawkish statement from Frankfurt has compressed the spread between euro and yen yields, forcing Asian central banks to recalculate their own paths in real time.",
    author: "Lena Hartmann",
    readMinutes: 7,
    dateISO: iso(TODAY),
    dateline: "FRANKFURT —",
    body: [
      "When Christine Lagarde stepped to the lectern on Thursday afternoon, markets were expecting reassurance. What they received instead was a careful, deliberate restatement of the bank's commitment to a tightening trajectory — and a single sentence, almost buried in the prepared remarks, that has rewritten next quarter's forecasts.",
      "\"The Governing Council does not see, in the present data, conditions warranting a pause,\" Madame Lagarde said. Within minutes, the euro had gained nearly a percent against the dollar; within hours, the yen had begun what currency strategists were already calling an orderly retreat.",
      "For Asia's export economies, the shift is consequential. A stronger euro increases the price of Asian-manufactured goods in European markets, while a weaker yen amplifies the competitive pressure on Korean and Taiwanese exporters who price in dollars but compete with Japanese counterparts.",
      "The Bank of Japan, which has long resisted intervention, may now find its hand forced. The Bank of Korea, already preparing a difficult statement of its own, has scheduled an unscheduled briefing for next Tuesday. The chessboard, as one Tokyo strategist put it, has been rearranged in a single sentence.",
    ],
  },
  {
    id: "a5",
    slug: "consciousness-variable",
    category: "Feature",
    section: "Science & Ethics",
    headline: "The Consciousness Variable",
    subhead:
      "Recent breakthroughs in neural mapping suggest a biological basis for subjective experience, challenging centuries of Cartesian philosophy.",
    summary:
      "A team at the Max Planck Institute has published the most granular map yet of the brain's claustrum — a region long suspected of orchestrating conscious experience. The findings, modest in tone and momentous in implication, reopen a question philosophers had quietly retired.",
    author: "Dr. Silas Thorne",
    readMinutes: 12,
    dateISO: iso(TODAY),
    dateline: "LEIPZIG —",
    pullQuote:
      "If consciousness has an address in the cortex, it raises a question philosophy has long avoided: what else has it?",
    body: [
      "The claustrum is a thin, irregular sheet of grey matter pressed between the insular cortex and the basal ganglia. For more than a century it has been described, with some embarrassment, as a structure in search of a function. This week, in a paper of unusual ambition, a research team has proposed that the function in question may be consciousness itself.",
      "The work, led by Dr. Helena Vogt of the Max Planck Institute for Cognitive and Brain Sciences, combines high-resolution diffusion imaging with optogenetic stimulation in non-human primates. The result is a map of unprecedented detail: a network of bidirectional projections linking nearly every region of the cortex through a single, thread-like organ.",
      "The implication is striking. If conscious experience requires the binding of disparate sensory and cognitive streams into a single, unified field, the claustrum is uniquely positioned to perform the binding. Stimulate it, and a primate's behaviour shifts in ways that resemble nothing so much as a transient suspension of awareness.",
      "Philosophers have been cautious in their response. \"A correlate is not a cause,\" noted Professor Daniel Hyland of Oxford. \"But this is the most precise correlate we have ever had.\" The qualification is gentle; the concession, considerable.",
      "The paper closes, characteristically, with a list of open questions. Among them: whether the claustrum's role is constitutive or merely facilitative; whether its function differs between species; and whether, in time, its activity might be measured non-invasively in humans. Each question carries the quiet weight of a research programme.",
      "For now, the field has its map. What it will draw upon that map remains, as ever, a matter of patience.",
    ],
  },
  {
    id: "a6",
    slug: "cricket-renaissance",
    category: "Sports",
    section: "Sports",
    headline: "The Cricket Renaissance",
    subhead:
      "How technology is rewriting the rulebook of the world's second most popular sport.",
    summary:
      "Ball-tracking, biomechanical analytics and player-load monitoring have moved from broadcast novelty to coaching staple, reshaping training regimens from county grounds in Sussex to the academies of Bengaluru.",
    author: "Imran Qureshi",
    readMinutes: 9,
    dateISO: iso(TODAY),
    dateline: "BENGALURU —",
    body: [
      "At the National Cricket Academy in Bengaluru, the nets look much as they always have: red soil, white sightscreens, the soft crack of leather on willow. What has changed is invisible. Each delivery is tracked by a constellation of cameras; each batter wears a sensor stitched into the collar; each evening, the day's data is reviewed by analysts who would not, a decade ago, have had a desk on the premises.",
      "The result is a sport that knows itself with uncomfortable precision. Bowlers are advised, sometimes against instinct, to alter their wrist position by three degrees. Batters are shown footage of dismissals they did not realise formed a pattern. Selectors, once governed by feel, now wield dashboards.",
      "Purists complain, as purists do. But the players, on the whole, do not. \"It tells me what my body is doing,\" said the young fast bowler Aryan Joshi after a recent session. \"That used to take ten years to learn.\"",
      "The renaissance, if that is what it is, has not displaced the game's older virtues. Patience, temperament, the ability to read a pitch in failing light — these remain stubbornly beyond the reach of any algorithm. What technology has changed is the rate at which the rest can be acquired. In a sport that once measured careers in summers, that is no small thing.",
    ],
  },
];

const previousEditions: Edition[] = Array.from({ length: 8 }).map((_, i) => {
  const day = i + 1;
  return {
    number: `${921 - day}-X`,
    volume: "CXIV",
    issue: `${42 - day}`,
    dateISO: offset(day),
    weather: { temp: `${24 + (i % 5)}°C`, conditions: ["Clear Skies", "Light Rain", "Overcast", "Humid"][i % 4], city: "New Delhi" },
    quote: { text: "The press is the best instrument for enlightening the mind.", author: "Thomas Jefferson" },
    articles: todayArticles, // archive references for browsing
  };
});

export const todaysEdition: Edition = {
  number: "921-X",
  volume: "CXIV",
  issue: "42",
  dateISO: iso(TODAY),
  weather: { temp: "28°C", conditions: "Clear Skies", city: "New Delhi" },
  quote: {
    text: "History is a set of lies agreed upon.",
    author: "Napoléon",
  },
  articles: todayArticles,
};

export const editions: Edition[] = [todaysEdition, ...previousEditions];

export function getArticleBySlug(slug: string): Article | undefined {
  for (const ed of editions) {
    const a = ed.articles.find((x) => x.slug === slug);
    if (a) return a;
  }
  return undefined;
}

export function getArticleNeighbors(slug: string) {
  const list = todaysEdition.articles;
  const idx = list.findIndex((a) => a.slug === slug);
  if (idx === -1) return { prev: undefined, next: undefined, index: -1, total: list.length };
  return {
    prev: list[(idx - 1 + list.length) % list.length],
    next: list[(idx + 1) % list.length],
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
