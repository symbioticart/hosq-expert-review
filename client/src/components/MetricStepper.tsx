import { Link, useSearchParams } from "react-router-dom";
import type { MetricDef, Rating } from "../lib/types";
import { cn } from "../lib/util";

interface Props {
  metrics: MetricDef[];
  ratings: Rating[];
  activeMetricId: string;
  projectSlug: string;
}

export function MetricStepper({ metrics, ratings, activeMetricId, projectSlug }: Props) {
  const scoreById = new Map<string, number>();
  for (const r of ratings) {
    if (r.metricId !== "final") scoreById.set(r.metricId, r.score);
  }

  return (
    <nav aria-label="Metrics progress" className="space-y-1">
      {metrics.map((m) => {
        const isActive = m.id === activeMetricId;
        const score = scoreById.get(m.id);
        const isDone = score != null;
        return (
          <Link
            key={m.id}
            to={`/project/${projectSlug}?m=${m.id}`}
            aria-current={isActive ? "page" : undefined}
            aria-label={`${m.nameEn}${isDone ? ` — rated ${score}/5` : " — not rated"}${isActive ? " (current)" : ""}`}
            className={cn(
              "group flex items-center gap-3 py-2 pl-3 pr-2 -mx-2 rounded-card transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral",
              isActive ? "bg-blush" : "hover:bg-zebra",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "shrink-0 flex items-center justify-center h-7 w-7 rounded-pill text-xs font-bold",
                isActive ? "bg-coral text-white" :
                isDone   ? "bg-greenDark text-white" :
                           "bg-zebra text-muted",
              )}
            >
              {isDone && !isActive ? "✓" : m.letter}
            </span>
            <span
              className={cn(
                "flex-1 min-w-0 text-sm leading-tight truncate",
                isActive ? "text-ink font-medium" : "text-muted",
              )}
            >
              {m.nameEn}
            </span>
            {isDone && (
              <span
                aria-hidden
                className={cn(
                  "shrink-0 text-[11px] font-mono tabular-nums",
                  isActive ? "text-coral font-bold" : "text-muted/70",
                )}
              >
                {score}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function StepperProgress({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? (done / total) * 100 : 0;
  return (
    <div className="pt-4 mt-4 border-t border-hairline">
      <div className="flex items-baseline justify-between text-xs text-muted mb-2">
        <span>Progress</span>
        <span>
          <strong className="text-ink">{done}</strong>/{total}
        </span>
      </div>
      <div className="h-1 rounded-full bg-blush overflow-hidden">
        <div className="h-full bg-coral transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Used by the header query when there's no ?m= parameter yet.
export function useMetricIdFromSearch(metrics: MetricDef[]): string {
  const [params] = useSearchParams();
  const m = params.get("m");
  return m && metrics.some((x) => x.id === m) ? m : metrics[0].id;
}
