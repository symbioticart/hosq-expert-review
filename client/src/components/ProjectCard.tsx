import { Link } from "react-router-dom";
import type { ProjectSummary, Rating } from "../lib/types";
import { cn, fmtScore } from "../lib/util";

interface Props {
  project: ProjectSummary;
  ratings: Rating[];
  totalMetrics: number;
  aiFinalScore?: number | null;   // 0..5 normalised
}

export function ProjectCard({ project, ratings, totalMetrics, aiFinalScore }: Props) {
  const scoredMetrics = ratings.filter((r) => r.metricId !== "final").length;
  const done = scoredMetrics >= totalMetrics && totalMetrics > 0;
  const inProgress = scoredMetrics > 0 && !done;
  const status = done ? "done" : inProgress ? "progress" : "new";

  // Expert final (weighted) — we compute a plain mean for the card; the backend computes weighted elsewhere
  const expertMean =
    scoredMetrics > 0
      ? ratings.reduce((s, r) => s + r.score, 0) / scoredMetrics
      : null;

  const statusBadge: Record<string, { label: string; cls: string }> = {
    new:      { label: "New",         cls: "bg-zebra text-muted" },
    progress: { label: `${scoredMetrics}/${totalMetrics}`, cls: "bg-coral text-white" },
    done:     { label: "Completed",   cls: "bg-greenDark text-white" },
  };
  const badge = statusBadge[status];

  const cta =
    status === "new" ? "Start" :
    status === "progress" ? "Continue" : "Review →";

  return (
    <Link
      to={`/project/${project.slug}`}
      className="group flex flex-col h-full bg-white rounded-card p-8 border border-transparent hover:border-coral transition no-shadow"
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <h3 className="font-bold text-[22px] leading-tight text-ink line-clamp-2 flex-1 min-h-[54px]">
          {project.name}
        </h3>
        <span className={cn("text-xs font-medium px-3 py-1 rounded-pill whitespace-nowrap", badge.cls)}>
          {badge.label}
        </span>
      </div>

      <p className="text-xs text-muted mb-5" title="Each project is rated across 10 metrics. The original project document and an AI evaluation are attached.">
        <span title="Ten weighted criteria you score from 0 to 5">{totalMetrics} metrics</span>
        <span className="mx-1.5 text-muted/40">·</span>
        <span title="Original project description PDF">source PDF</span>
        <span className="mx-1.5 text-muted/40">·</span>
        <span title="LLM evaluation of the same metrics for comparison">AI analysis</span>
      </p>

      <div className="flex gap-1.5 mb-5">
        {Array.from({ length: totalMetrics }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2 w-2 rounded-full",
              i < scoredMetrics ? "bg-coral" : "bg-blush",
            )}
          />
        ))}
      </div>

      <div className="mb-5 min-h-[92px]">
        {done && (
          <div className="grid grid-cols-2 gap-4 p-4 rounded-card bg-zebra">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted">You</div>
              <div className="text-2xl font-bold text-coral">{fmtScore(expertMean)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted">AI</div>
              <div className="text-2xl font-bold text-violet">
                {aiFinalScore == null ? "—" : fmtScore(aiFinalScore)}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-2">
        <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill bg-ink text-cream text-sm font-medium hover:bg-coral transition-colors">
          {cta}
        </span>
      </div>
    </Link>
  );
}
