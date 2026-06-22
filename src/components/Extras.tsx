import { useState } from "react";
import type { Extra } from "@/lib/articles";

// A boxed "margin" item — the recurring frame for every extra.
function Card({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-6 break-inside-avoid border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] p-5 ${className}`}>
      <div className="eyebrow mb-3 flex items-center gap-2">
        <span className="inline-block h-px w-4 bg-[color:var(--color-accent)]" />
        {label}
      </div>
      {children}
    </div>
  );
}

function Reveal({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  if (open) return <div className="mt-3 text-[0.95rem] leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>{children}</div>;
  return (
    <button
      onClick={() => setOpen(true)}
      className="mt-3 meta link-underline cursor-pointer"
    >
      {label} →
    </button>
  );
}

function Stars({ n = 0 }: { n?: number }) {
  return (
    <span aria-label={`${n} out of 5`} className="text-[color:var(--color-accent)] tracking-widest">
      {"★".repeat(n)}
      <span className="text-[color:var(--color-rule)]">{"★".repeat(Math.max(0, 5 - n))}</span>
    </span>
  );
}

function ExtraCard({ extra }: { extra: Extra }) {
  switch (extra.type) {
    case "funfact":
      return (
        <Card label={extra.title ?? "Fun Fact"}>
          <p className="text-[0.98rem] leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>{extra.text}</p>
        </Card>
      );

    case "quote":
      return (
        <Card label="Quote of the Day">
          <blockquote className="text-xl leading-snug italic" style={{ fontFamily: "var(--font-display)" }}>
            “{extra.text}”
          </blockquote>
          <div className="meta mt-3">— {extra.author}</div>
        </Card>
      );

    case "onthisday":
      return (
        <Card label="On This Day">
          <ul className="space-y-3">
            {extra.entries.map((e, i) => (
              <li key={i} className="grid grid-cols-[3.5rem_1fr] gap-3">
                <span className="font-[var(--font-display)] text-lg font-black text-[color:var(--color-accent)]">{e.year}</span>
                <span className="text-[0.95rem] leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>{e.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      );

    case "quiz":
      return (
        <Card label="Quick Quiz">
          <p className="text-[1.05rem] font-medium leading-snug" style={{ fontFamily: "var(--font-display)" }}>{extra.question}</p>
          {extra.options && (
            <ul className="mt-3 space-y-1.5">
              {extra.options.map((o, i) => (
                <li key={i} className="text-[0.95rem] flex gap-2" style={{ fontFamily: "var(--font-serif)" }}>
                  <span className="meta">{String.fromCharCode(65 + i)}</span>
                  {o}
                </li>
              ))}
            </ul>
          )}
          <Reveal label="Reveal answer">
            <strong>{extra.answer}</strong>
            {extra.note ? <span className="text-[color:var(--color-ink-soft)]"> — {extra.note}</span> : null}
          </Reveal>
        </Card>
      );

    case "puzzle":
      return (
        <Card label={`Puzzle · ${extra.kind}`}>
          <p className="text-[1.02rem] leading-relaxed italic" style={{ fontFamily: "var(--font-serif)" }}>{extra.prompt}</p>
          <Reveal label="Reveal solution">
            <strong>{extra.answer}</strong>
          </Reveal>
        </Card>
      );

    case "review":
      return (
        <Card label={`${extra.medium} Review`}>
          <div className="flex items-baseline justify-between gap-3">
            <h4 className="text-lg font-black leading-tight">{extra.title}</h4>
            {extra.rating ? <Stars n={extra.rating} /> : null}
          </div>
          <div className="meta mt-1">{extra.creator}</div>
          <p className="mt-3 text-[0.95rem] leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>{extra.text}</p>
        </Card>
      );

    case "healthtip":
      return (
        <Card label={extra.title ?? "Wellbeing"}>
          <p className="text-[0.98rem] leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>{extra.text}</p>
        </Card>
      );

    case "weather":
      return (
        <Card label="Weather">
          <div className="flex items-baseline gap-3">
            <span className="font-[var(--font-display)] text-3xl font-black">{extra.temp}</span>
            <span className="text-[0.95rem]" style={{ fontFamily: "var(--font-serif)" }}>{extra.conditions}</span>
          </div>
          <div className="meta mt-2">{extra.city}</div>
        </Card>
      );

    case "factcheck":
      return (
        <Card label="Fact Check">
          <p className="text-[1.02rem] font-medium leading-snug italic" style={{ fontFamily: "var(--font-serif)" }}>“{extra.claim}”</p>
          <div className="mt-3 inline-block border border-[color:var(--color-accent)] px-2 py-0.5 meta text-[color:var(--color-accent)]">
            {extra.verdict}
          </div>
          <p className="mt-3 text-[0.95rem] leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>{extra.explanation}</p>
        </Card>
      );

    case "letter":
      return (
        <Card label="Letter to the Editor">
          <p className="text-[0.98rem] leading-relaxed italic" style={{ fontFamily: "var(--font-serif)" }}>{extra.text}</p>
          <div className="meta mt-3">— {extra.author}{extra.city ? `, ${extra.city}` : ""}</div>
        </Card>
      );

    case "markets":
      return (
        <Card label="Markets">
          <table className="w-full text-[0.95rem]" style={{ fontFamily: "var(--font-serif)" }}>
            <tbody>
              {extra.items.map((it, i) => {
                const down = it.change.trim().startsWith("-");
                return (
                  <tr key={i} className="border-b border-[color:var(--color-rule)] last:border-0">
                    <td className="py-1.5">{it.name}</td>
                    <td className="py-1.5 text-right tabular-nums">{it.value}</td>
                    <td className={`py-1.5 text-right tabular-nums meta ${down ? "text-[color:var(--color-accent)]" : ""}`}>{it.change}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      );

    case "standings":
      return (
        <Card label={extra.title}>
          <ul className="space-y-1.5">
            {extra.rows.map((r, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3 border-b border-[color:var(--color-rule)] pb-1.5 last:border-0">
                <span className="text-[0.95rem]" style={{ fontFamily: "var(--font-serif)" }}>{r.name}</span>
                <span className="meta">{r.detail}</span>
              </li>
            ))}
          </ul>
        </Card>
      );

    default:
      return null;
  }
}

/** Renders extras as a masonry of cards — narrow ("aside") or wide ("grid"). */
export function Extras({ items, layout = "aside" }: { items: Extra[]; layout?: "aside" | "grid" }) {
  if (!items?.length) return null;
  const cols =
    layout === "grid"
      ? "columns-1 sm:columns-2 lg:columns-3"
      : "columns-1 sm:columns-2 lg:columns-1";
  return (
    <div className={`${cols} gap-6`}>
      {items.map((extra, i) => (
        <ExtraCard key={i} extra={extra} />
      ))}
    </div>
  );
}
