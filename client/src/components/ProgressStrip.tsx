import { Link, useLocation } from "react-router-dom";
import { useExpertId } from "../hooks/useExpertId";
import { useProjectsAndMetrics } from "../hooks/useProjects";
import { useAllRatings } from "../hooks/useRatings";
import { cn } from "../lib/util";

/**
 * Persistent progress strip — mounted under sticky Header on every authenticated page.
 *
 * Three columns:
 *   1. Goal label  ("Rate all 5 projects → combined PDF")
 *   2. Segmented progress bar — one segment per project, coral fill = ratings done.
 *      Each segment is a Link to that project; current is outlined.
 *   3. Reward button "Download PDF report" — disabled until 50/50, then unlocks
 *      and routes to /all-reports.
 */
export function ProgressStrip() {
  const [expertId] = useExpertId();
  const { manifest, metrics } = useProjectsAndMetrics();
  const { ratings } = useAllRatings(expertId);
  const location = useLocation();

  if (!expertId || !manifest || !metrics) return null;

  const totalMetrics = metrics.metrics.length;
  const projects = manifest.projects;
  const expectedTotal = projects.length * totalMetrics;

  const realRatings = ratings.filter((r) => r.metricId !== "final");
  const scoredTotal = realRatings.length;
  const remaining = Math.max(0, expectedTotal - scoredTotal);
  const allDone = expectedTotal > 0 && scoredTotal >= expectedTotal;
  const pct = expectedTotal === 0 ? 0 : Math.min(100, (scoredTotal / expectedTotal) * 100);

  // current project from URL
  const slugMatch = location.pathname.match(/^\/project\/([^/]+)/);
  const currentSlug = slugMatch?.[1] ?? null;

  // per-project counts
  const segments = projects.map((p) => {
    const scored = realRatings.filter((r) => r.projectId === p.id).length;
    const segPct = totalMetrics === 0 ? 0 : (scored / totalMetrics) * 100;
    return { project: p, scored, segPct };
  });

  const completedProjects = segments.filter((s) => s.scored >= totalMetrics).length;

  return (
    <div className="no-print sticky top-[57px] z-20 bg-cream border-b border-hairline">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
        {/* 1. Goal label — visible always; on mobile sits above the bar */}
        <div className="shrink-0 flex md:block items-baseline gap-2 md:gap-0">
          <div className="text-[9px] uppercase tracking-[0.2em] text-muted/80 leading-tight">
            Your goal
          </div>
          <div className="text-[13px] text-ink font-medium leading-tight md:mt-0.5">
            Rate all {projects.length} projects
          </div>
        </div>

        {/* 2. Segmented bar */}
        <div className="flex-1 min-w-0">
          <div
            className="flex gap-1 h-3"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={expectedTotal}
            aria-valuenow={scoredTotal}
            aria-label={`${scoredTotal} of ${expectedTotal} ratings completed`}
          >
            {segments.map(({ project, scored, segPct }) => {
              const isCurrent = project.slug === currentSlug;
              const isComplete = scored >= totalMetrics;
              return (
                <Link
                  key={project.id}
                  to={`/project/${project.slug}`}
                  title={`${project.name} — ${scored} / ${totalMetrics} rated`}
                  className={cn(
                    "flex-1 relative rounded-sm bg-blush overflow-hidden transition-shadow hover:ring-1 hover:ring-ink hover:ring-offset-1 hover:ring-offset-cream",
                    isCurrent && "ring-1 ring-ink ring-offset-1 ring-offset-cream",
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 transition-all",
                      isComplete ? "bg-greenDark" : "bg-coral",
                    )}
                    style={{ width: `${segPct}%` }}
                  />
                </Link>
              );
            })}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] leading-none">
            <span className="text-muted">
              <strong className="text-ink font-medium">{completedProjects}</strong>
              <span className="text-muted/80"> of {projects.length} projects</span>
              <span className="mx-2 text-muted/40">·</span>
              <strong className="text-ink font-medium">{scoredTotal}</strong>
              <span className="text-muted/80"> / {expectedTotal} ratings</span>
            </span>
            <span className="text-muted/70 hidden md:inline">{Math.round(pct)} % complete</span>
          </div>
        </div>

        {/* 3. Reward button */}
        {allDone ? (
          <Link
            to="/all-reports"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-pill bg-ink text-cream text-xs font-bold hover:bg-coral transition-colors"
            title="Open the combined PDF print view"
          >
            <span aria-hidden>⬇</span>
            Download PDF report
            <span aria-hidden>→</span>
          </Link>
        ) : (
          <span
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-pill bg-hairline/60 text-muted/70 text-xs font-bold cursor-not-allowed select-none"
            title={`Rate ${remaining} more to unlock the combined PDF`}
            aria-disabled="true"
          >
            <span aria-hidden>⬇</span>
            Download PDF report
            <span className="text-muted/60 font-normal">· {remaining} to go</span>
          </span>
        )}
      </div>
    </div>
  );
}
