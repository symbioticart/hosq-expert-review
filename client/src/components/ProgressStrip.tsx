import { Link, useLocation } from "react-router-dom";
import { useExpertId } from "../hooks/useExpertId";
import { useProjectsAndMetrics } from "../hooks/useProjects";
import { useAllRatings } from "../hooks/useRatings";
import { cn } from "../lib/util";

/**
 * Persistent progress strip mounted under the sticky Header on every authenticated page.
 *
 * Shows:
 *   - 5 project dots (●=done, ◐=in-progress, ○=new), clickable, current one outlined
 *   - "X / 50 ratings" counter
 *   - Slim coral progress bar
 *
 * Hidden in print, on /start (no expert), and when manifest hasn't loaded yet.
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

  // ratings excluding any "final" pseudo-metric, just in case
  const realRatings = ratings.filter((r) => r.metricId !== "final");
  const scoredTotal = realRatings.length;
  const pct = expectedTotal === 0 ? 0 : Math.min(100, (scoredTotal / expectedTotal) * 100);

  // current project slug, if we're inside one
  const slugMatch = location.pathname.match(/^\/project\/([^/]+)/);
  const currentSlug = slugMatch?.[1] ?? null;

  // per-project status
  const byProject = projects.map((p) => {
    const scored = realRatings.filter((r) => r.projectId === p.id).length;
    const status: "new" | "progress" | "done" =
      scored === 0 ? "new" : scored >= totalMetrics ? "done" : "progress";
    return { project: p, scored, status };
  });

  const completedProjects = byProject.filter((b) => b.status === "done").length;

  return (
    <div className="no-print sticky top-[57px] z-20 bg-cream/95 backdrop-blur border-b border-hairline">
      <div className="max-w-[1400px] mx-auto flex items-center gap-4 px-8 py-2 text-xs">
        {/* project dots */}
        <div className="flex items-center gap-1.5 shrink-0">
          {byProject.map(({ project, status, scored }) => {
            const isCurrent = project.slug === currentSlug;
            const dot =
              status === "done"
                ? "bg-greenDark border-greenDark"
                : status === "progress"
                ? "bg-coral/40 border-coral"
                : "bg-transparent border-hairline";
            return (
              <Link
                key={project.id}
                to={`/project/${project.slug}`}
                title={`${project.name} · ${scored}/${totalMetrics} rated`}
                className={cn(
                  "h-3.5 w-3.5 rounded-pill border transition-colors hover:border-ink",
                  dot,
                  isCurrent && "ring-2 ring-ink ring-offset-1 ring-offset-cream",
                )}
              />
            );
          })}
        </div>

        {/* counter */}
        <div className="text-muted whitespace-nowrap">
          <strong className="text-ink font-medium">{completedProjects}</strong>
          <span className="text-muted/70"> of {projects.length} projects</span>
          <span className="mx-2 text-muted/40">·</span>
          <strong className="text-ink font-medium">{scoredTotal}</strong>
          <span className="text-muted/70"> / {expectedTotal} ratings</span>
        </div>

        {/* bar */}
        <div className="flex-1 min-w-[80px] h-1.5 rounded-full bg-blush overflow-hidden">
          <div
            className="h-full bg-coral transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* terminal CTA when all 50 done */}
        {scoredTotal >= expectedTotal && expectedTotal > 0 && (
          <Link
            to="/all-reports"
            className="px-3 py-1 rounded-pill bg-ink text-cream font-medium hover:bg-coral transition-colors whitespace-nowrap"
          >
            Download all PDFs →
          </Link>
        )}
      </div>
    </div>
  );
}
