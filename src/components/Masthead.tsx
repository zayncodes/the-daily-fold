import { Link } from "@tanstack/react-router";
import { formatLongDate, todaysEdition } from "@/lib/articles";

export function Masthead({ compact = false }: { compact?: boolean }) {
  const ed = todaysEdition;
  const date = formatLongDate(ed.dateISO);
  return (
    <header className="w-full">
      <div className="grid grid-cols-12 items-end gap-4 pt-8 pb-4">
        <div className="col-span-12 md:col-span-3 meta leading-relaxed">
          <div>Vol. {ed.volume} — No. {ed.issue}</div>
          <div className="mt-1">New Delhi · Mumbai · London</div>
        </div>
        <div className="col-span-12 md:col-span-6 text-center">
          <Link to="/" className="inline-block">
            <h1 className={`masthead ${compact ? "text-5xl md:text-6xl" : "text-6xl md:text-8xl"}`}>
              The Chronicle
            </h1>
          </Link>
        </div>
        <div className="col-span-12 md:col-span-3 meta text-left md:text-right leading-relaxed">
          <div>{date}</div>
          <div className="mt-1 italic text-[color:var(--color-accent)] not-italic" style={{ fontStyle: "italic" }}>
            Edition: International Premier
          </div>
        </div>
      </div>

      <div className="rule-double flex flex-wrap items-center justify-between gap-3 meta">
        <div className="flex items-center gap-4">
          <span>{ed.weather.temp} · {ed.weather.conditions}</span>
          <span className="hidden md:inline italic" style={{ fontFamily: "var(--font-serif)", textTransform: "none", letterSpacing: 0, fontSize: "0.85rem" }}>
            "{ed.quote.text}" — {ed.quote.author}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Price: ₹15.00</span>
          <span>Archive No. {ed.number}</span>
        </div>
      </div>

      <nav className="flex flex-wrap items-center justify-center gap-6 py-4 meta border-b border-[color:var(--color-rule)]">
        <Link to="/" className="link-underline">Front Page</Link>
        <Link to="/archive" className="link-underline">Archive</Link>
        <a href="#national" className="link-underline">National</a>
        <a href="#international" className="link-underline">World</a>
        <a href="#feature" className="link-underline">Features</a>
        <a href="#sports" className="link-underline">Sports</a>
      </nav>
    </header>
  );
}
