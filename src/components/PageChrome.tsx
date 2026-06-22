import { Link, useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { PAGE_META, TOTAL_PAGES, pageNeighbors } from "@/lib/articles";
import { useSwipe } from "@/hooks/use-swipe";

export function metaFor(n: number) {
  return PAGE_META.find((p) => p.n === n);
}

/** A typed Link that targets page n (page 1 -> "/", others -> "/page/$n"). */
export function PageLink({
  n,
  className,
  title,
  children,
}: {
  n: number;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  if (n <= 1) {
    return (
      <Link to="/" className={className} title={title}>
        {children}
      </Link>
    );
  }
  return (
    <Link to="/page/$n" params={{ n: String(n) }} className={className} title={title}>
      {children}
    </Link>
  );
}

/** Keyboard arrows + swipe to flip between pages. */
export function usePageNav(n: number) {
  const navigate = useNavigate();
  const { prev, next } = pageNeighbors(n);
  const go = (k?: number) => {
    if (!k) return;
    if (k <= 1) navigate({ to: "/" });
    else navigate({ to: "/page/$n", params: { n: String(k) } });
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") go(next);
      else if (e.key === "ArrowLeft") go(prev);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prev, next]);
  const swipe = useSwipe(
    () => go(next),
    () => go(prev),
  );
  return { prev, next, go, swipe };
}

/** Full-width "page turn": the whole spread swings in from its left spine. */
export function PageTransition({
  pageKey,
  children,
}: {
  pageKey: string | number;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      key={pageKey}
      initial={{ opacity: 0, x: 64, rotateY: -7 }}
      animate={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformOrigin: "left center", transformPerspective: 2200 }}
    >
      {children}
    </motion.div>
  );
}

/** The 1..10 page jumper. */
export function PageStrip({ current }: { current: number }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 py-5">
      {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map((k) => {
        const active = k === current;
        return (
          <PageLink
            key={k}
            n={k}
            title={metaFor(k)?.title}
            className={`flex h-8 w-8 items-center justify-center text-[0.8rem] tabular-nums transition-colors ${
              active
                ? "bg-[color:var(--color-ink)] text-[color:var(--color-paper)]"
                : "border border-[color:var(--color-rule)] text-[color:var(--color-ink-soft)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)]"
            }`}
          >
            {k}
          </PageLink>
        );
      })}
    </div>
  );
}

/** Prev / next page links + the page strip. */
export function PageFooterNav({ n }: { n: number }) {
  const { prev, next } = pageNeighbors(n);
  const prevMeta = prev ? metaFor(prev) : undefined;
  const nextMeta = next ? metaFor(next) : undefined;
  return (
    <div>
      <nav className="grid grid-cols-2 gap-6 border-t border-[color:var(--color-ink)] py-8">
        <div>
          {prevMeta && (
            <PageLink n={prevMeta.n} className="block group">
              <div className="meta mb-2">← Page {prevMeta.n}</div>
              <div className="text-xl md:text-2xl font-black tracking-tight group-hover:opacity-80">
                {prevMeta.title}
              </div>
            </PageLink>
          )}
        </div>
        <div className="text-right">
          {nextMeta && (
            <PageLink n={nextMeta.n} className="block group">
              <div className="meta mb-2">Page {nextMeta.n} →</div>
              <div className="text-xl md:text-2xl font-black tracking-tight group-hover:opacity-80">
                {nextMeta.title}
              </div>
            </PageLink>
          )}
        </div>
      </nav>
      <PageStrip current={n} />
    </div>
  );
}
