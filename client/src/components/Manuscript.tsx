import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { AiMetricEval, MetricDef, Rating } from "../lib/types";
import { cn } from "../lib/util";
import { HowBlock } from "./MetricBlock";

/**
 * Manuscript view — refactor of the per-metric Form into a single long document.
 *
 * Design intent (audited against four reviewers):
 * - Visual lightness: no card backgrounds for sections, hairline-only dividers,
 *   inline score row, comment textarea is unstyled until focused.
 * - Document feel: 10 metrics flow as one scrollable manuscript with a slim
 *   table-of-contents on the left; AI reveal collapses inline as a margin-style
 *   aside (left violet rule).
 * - Brand intact: HOSQ tokens (coral, violet, greenDark, ink, cream, hairline,
 *   rounded-pill on actions only). Cera Pro hierarchy preserved.
 */

/** ───────────────────────────────────────────────────────── INLINE SCORE PICKER */

export function InlineScorePicker({
  value,
  onChange,
  size = "md",
}: {
  value: number | null;
  onChange: (n: number) => void;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  return (
    <div role="radiogroup" aria-label="Score from 0 to 5" className="flex gap-1.5 flex-wrap">
      {[0, 1, 2, 3, 4, 5].map((n) => {
        const active = value === n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`Score ${n} of 5`}
            onClick={() => onChange(n)}
            className={cn(
              "rounded-pill font-bold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
              dim,
              active
                ? "bg-coral text-white border-coral"
                : "bg-transparent text-ink border-ink/20 hover:border-ink",
            )}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

/** ───────────────────────────────────────────────────────── TABLE OF CONTENTS */

export function ManuscriptTOC({
  metrics,
  ratings,
  activeId,
  allDone,
  finalHref,
}: {
  metrics: MetricDef[];
  ratings: Rating[];
  activeId: string | null;
  allDone: boolean;
  finalHref: string;
}) {
  const scoreById = new Map<string, number>();
  for (const r of ratings) {
    if (r.metricId !== "final") scoreById.set(r.metricId, r.score);
  }

  return (
    <aside className="no-print hidden lg:block sticky top-[120px] self-start shrink-0 w-[200px] max-h-[calc(100vh-140px)] overflow-y-auto pr-4 pl-2 py-8">
      <div className="text-[9px] uppercase tracking-[0.25em] text-muted/80 mb-3 font-medium">
        Contents
      </div>
      <ol className="space-y-px">
        {metrics.map((m) => {
          const score = scoreById.get(m.id);
          const isActive = m.id === activeId;
          return (
            <li key={m.id}>
              <a
                href={`#metric-${m.letter}`}
                aria-current={isActive ? "location" : undefined}
                aria-label={`${m.nameEn}${score != null ? ` — rated ${score} of 5` : " — not rated yet"}${isActive ? " (current section)" : ""}`}
                className={cn(
                  "group flex items-baseline gap-3 py-1.5 pl-3 -ml-[2px] text-[13px] leading-snug transition-colors",
                  "border-l-2",
                  isActive
                    ? "border-coral text-ink font-medium"
                    : "border-transparent text-muted hover:text-ink",
                )}
              >
                <span className="shrink-0 font-mono text-[10px] tabular-nums w-3 text-muted/80">
                  {m.letter}
                </span>
                <span className="flex-1 truncate">{m.nameEn}</span>
                {score != null && (
                  <span
                    className={cn(
                      "shrink-0 text-[11px] font-bold font-mono tabular-nums",
                      isActive ? "text-coral" : "text-muted/70",
                    )}
                    aria-hidden
                  >
                    {score}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ol>
      <div className="mt-5 pt-4 border-t border-hairline">
        {allDone ? (
          <Link
            to={finalHref}
            className="inline-flex items-center gap-1 text-[13px] text-coral hover:text-ink font-medium transition-colors"
          >
            See result <span aria-hidden>→</span>
          </Link>
        ) : (
          <span className="text-[11px] text-muted/70 leading-snug" title="Rate every section to unlock">
            Rate all {metrics.length} sections to see the result.
          </span>
        )}
      </div>
    </aside>
  );
}

/** ───────────────────────────────────────────────────────── ONE METRIC SECTION */

export function ManuscriptSection({
  metric,
  rating,
  ai,
  aiNotEvaluated,
  onScore,
  onComment,
  saving,
}: {
  metric: MetricDef;
  rating: Rating | null;
  ai: AiMetricEval | null;
  aiNotEvaluated: boolean;
  onScore: (n: number) => void;
  onComment: (s: string) => void;
  saving: boolean;
}) {
  // Local draft for the comment so typing doesn't rely on parent re-render.
  const initialComment = rating?.comment ?? "";
  const [draftComment, setDraftComment] = useState<string>(initialComment);
  const [draftScore, setDraftScore] = useState<number | null>(rating?.score ?? null);
  const [howOpen, setHowOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const lastSavedRef = useRef<string>(initialComment);

  // Server-driven prop changes (e.g. ratings hydrate after mount) replace the draft
  // only when local hasn't diverged.
  useEffect(() => {
    const remote = rating?.comment ?? "";
    if (lastSavedRef.current === draftComment) {
      setDraftComment(remote);
      lastSavedRef.current = remote;
    }
  }, [rating?.comment, draftComment]);

  useEffect(() => {
    setDraftScore(rating?.score ?? null);
  }, [rating?.score]);

  const handleScore = (n: number) => {
    setDraftScore(n);
    onScore(n);
  };

  const handleCommentBlur = () => {
    if (draftComment !== lastSavedRef.current) {
      onComment(draftComment);
      lastSavedRef.current = draftComment;
    }
  };

  return (
    <section
      id={`metric-${metric.letter}`}
      data-metric-id={metric.id}
      className="scroll-mt-[140px] pt-12 first:pt-2 mb-2 border-t first:border-t-0 border-hairline"
      aria-labelledby={`metric-${metric.letter}-title`}
    >
      <header className="flex items-baseline gap-3 mb-2">
        <span className="font-mono text-[11px] font-bold text-coral tabular-nums uppercase tracking-wider shrink-0">
          {metric.letter}
        </span>
        <h2
          id={`metric-${metric.letter}-title`}
          className="font-bold text-[28px] leading-[1.15] text-ink"
        >
          {metric.nameEn}
        </h2>
      </header>

      <div className="text-[10px] uppercase tracking-wider text-muted mb-5">
        weight {metric.weight.toFixed(2)}
        {draftScore != null && (
          <>
            <span className="mx-2 text-muted/40">·</span>
            <span className="text-coral font-bold normal-case tracking-normal">
              your score {draftScore}/5
            </span>
          </>
        )}
      </div>

      <p className="text-[17px] leading-[1.7] text-ink/85 max-w-[640px]">
        {metric.what}
      </p>

      {/* "How to score" — footnote-style toggle. */}
      <div className="mt-4 mb-8">
        <button
          type="button"
          onClick={() => setHowOpen((v) => !v)}
          aria-expanded={howOpen}
          className="text-[11px] uppercase tracking-wider text-muted hover:text-ink transition-colors inline-flex items-center gap-1.5"
        >
          <span aria-hidden className={cn("inline-block transition-transform", howOpen && "rotate-90")}>
            ▸
          </span>
          How to score this
        </button>
        {howOpen && (
          <div className="mt-4 pl-4 border-l-2 border-hairline">
            <HowBlock metric={metric} />
          </div>
        )}
      </div>

      {/* Score row — inline, not a "form section" */}
      <div className="my-7 flex items-baseline gap-4 flex-wrap">
        <span className="text-[11px] uppercase tracking-wider text-muted">Your score</span>
        <InlineScorePicker value={draftScore} onChange={handleScore} />
        {saving && (
          <span className="text-[11px] text-muted/70 italic" aria-live="polite">saving…</span>
        )}
        {!saving && draftScore != null && (
          <span className="text-[11px] text-greenDark/80 font-medium" aria-live="polite">saved</span>
        )}
      </div>

      {/* Notes — text-document feel: no border until focus */}
      <div className="my-7">
        <label
          htmlFor={`notes-${metric.id}`}
          className="block text-[11px] uppercase tracking-wider text-muted mb-2"
        >
          Your notes
        </label>
        <textarea
          id={`notes-${metric.id}`}
          value={draftComment}
          onChange={(e) => setDraftComment(e.target.value)}
          onBlur={handleCommentBlur}
          placeholder="What is strong, what is weak…"
          rows={3}
          className="w-full bg-transparent border-0 border-b border-hairline focus:border-coral focus:outline-none transition-colors text-[16px] leading-7 text-ink placeholder-muted/60 resize-y py-2 -mx-1 px-1"
        />
      </div>

      {/* AI reveal — margin-aside style with left violet rule */}
      {aiNotEvaluated || !ai ? null : (
        <div className="mt-8 -ml-4 pl-4 border-l-2 border-violet/50">
          <button
            type="button"
            onClick={() => setAiOpen((v) => !v)}
            aria-expanded={aiOpen}
            className="inline-flex items-baseline gap-2 text-[13px] text-violet hover:text-ink transition-colors"
          >
            <span aria-hidden className={cn("inline-block transition-transform", aiOpen && "rotate-90")}>
              ▸
            </span>
            <span className="uppercase tracking-wider text-[10px] font-medium">AI evaluation</span>
            <span className="font-bold">≈ {ai.score}/{ai.scoreMax}</span>
            {draftScore != null && (
              <DeltaBadge expert={draftScore} aiOnFive={(ai.score / ai.scoreMax) * 5} />
            )}
          </button>
          {aiOpen && <AiInline ai={ai} />}
        </div>
      )}
    </section>
  );
}

function DeltaBadge({ expert, aiOnFive }: { expert: number; aiOnFive: number }) {
  const d = expert - aiOnFive;
  const sign = d > 0.05 ? "+" : "";
  const label = `${sign}${d.toFixed(1)}`;
  const cls =
    Math.abs(d) < 0.5
      ? "bg-zebra text-muted"
      : d > 0
      ? "bg-green/15 text-greenDark"
      : "bg-coral/10 text-coral";
  return (
    <span className={cn("font-mono text-[10px] px-1.5 py-0.5 rounded-pill", cls)} title="Delta (your score − AI)">
      Δ {label}
    </span>
  );
}

function AiInline({ ai }: { ai: AiMetricEval }) {
  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-[13px] leading-snug">
      <div>
        <h4 className="text-[10px] uppercase tracking-wider text-greenDark font-bold mb-1.5">
          Strengths
        </h4>
        <ul className="space-y-1">
          {ai.pros.length === 0 ? (
            <li className="text-muted italic">— none recorded —</li>
          ) : (
            ai.pros.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="text-greenDark shrink-0 mt-0.5">●</span>
                <span className="text-ink/85">{p}</span>
              </li>
            ))
          )}
        </ul>
      </div>
      <div>
        <h4 className="text-[10px] uppercase tracking-wider text-coral font-bold mb-1.5">
          Weaknesses
        </h4>
        <ul className="space-y-1">
          {ai.cons.length === 0 ? (
            <li className="text-muted italic">— none recorded —</li>
          ) : (
            ai.cons.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="text-coral shrink-0 mt-0.5">●</span>
                <span className="text-ink/85">{c}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

/** ───────────────────────────────────────────────────────── SCROLL-SPY HOOK */

export function useScrollSpy(metricIds: string[]): string | null {
  const [active, setActive] = useState<string | null>(metricIds[0] ?? null);
  useEffect(() => {
    if (!metricIds.length) return;
    const els = metricIds
      .map((id) => document.querySelector<HTMLElement>(`section[data-metric-id="${id}"]`))
      .filter((x): x is HTMLElement => x != null);
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the one whose top is closest to the top reference line.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = (visible[0].target as HTMLElement).getAttribute("data-metric-id");
          if (id) setActive(id);
        }
      },
      { rootMargin: "-130px 0px -55% 0px", threshold: 0 },
    );
    for (const el of els) observer.observe(el);
    return () => observer.disconnect();
  }, [metricIds]);
  return active;
}
