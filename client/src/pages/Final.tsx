import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Header } from "../components/Layout";
import { ReportView } from "../components/ReportView";
import { useExpertId } from "../hooks/useExpertId";
import { useProjectsAndMetrics } from "../hooks/useProjects";
import { useAllRatings } from "../hooks/useRatings";
import { fetchSummary } from "../lib/api";
import type { ProjectSummary, ProjectSummaryResponse } from "../lib/types";

interface NextSuggestion {
  kind: "in-progress" | "new" | "all-done";
  project: ProjectSummary | null;
  scored: number;
  totalMetrics: number;
}

function pickNext(
  projects: ProjectSummary[],
  currentId: string,
  ratingsByProject: Map<string, number>,
  totalMetrics: number,
): NextSuggestion {
  const others = projects.filter((p) => p.id !== currentId);
  // prefer in-progress (any score 1..totalMetrics-1)
  const inProgress = others.find((p) => {
    const s = ratingsByProject.get(p.id) ?? 0;
    return s > 0 && s < totalMetrics;
  });
  if (inProgress) {
    return { kind: "in-progress", project: inProgress, scored: ratingsByProject.get(inProgress.id) ?? 0, totalMetrics };
  }
  const newOne = others.find((p) => (ratingsByProject.get(p.id) ?? 0) === 0);
  if (newOne) {
    return { kind: "new", project: newOne, scored: 0, totalMetrics };
  }
  return { kind: "all-done", project: null, scored: 0, totalMetrics };
}

export default function Final() {
  const { slug = "" } = useParams();
  const [expertId] = useExpertId();
  const { manifest, metrics, loading } = useProjectsAndMetrics();
  const { ratings: allRatings } = useAllRatings(expertId);
  const [summary, setSummary] = useState<ProjectSummaryResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const project = manifest?.projects.find((p) => p.slug === slug);

  useEffect(() => {
    if (!project) return;
    setErr(null);
    fetchSummary(expertId, project.id)
      .then(setSummary)
      .catch((e) => {
        setErr(e instanceof Error ? e.message : "Could not load summary.");
        // eslint-disable-next-line no-console
        console.error(e);
      });
  }, [project, expertId]);

  const noRatings = summary != null && (summary.expertProgress ?? 0) === 0;

  const next: NextSuggestion | null = useMemo(() => {
    if (!manifest || !metrics || !project) return null;
    const counts = new Map<string, number>();
    for (const r of allRatings) {
      if (r.metricId === "final") continue;
      counts.set(r.projectId, (counts.get(r.projectId) ?? 0) + 1);
    }
    return pickNext(manifest.projects, project.id, counts, metrics.metrics.length);
  }, [manifest, metrics, project, allRatings]);

  const reportDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  if (loading || !manifest || !metrics) {
    return <div className="p-8 text-muted">Loading…</div>;
  }
  if (!project) {
    return (
      <div className="p-8">
        <Link to="/" className="text-coral hover:underline">← All projects</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream print:bg-white">
      <div className="no-print"><Header /></div>

      <main className="max-w-[1200px] mx-auto px-10 py-12 print:px-0 print:py-0 print:max-w-none">
        <Link to={`/project/${project.slug}`} className="no-print text-xs text-muted hover:text-ink transition">
          ← Back to review
        </Link>

        {err && (
          <div className="no-print mt-6 rounded-card border border-coral/40 bg-coral/5 p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="text-sm text-coral">Couldn't load summary: {err}.</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setErr(null);
                  if (project) {
                    fetchSummary(expertId, project.id)
                      .then(setSummary)
                      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load summary."));
                  }
                }}
                className="px-4 py-2 rounded-pill bg-ink text-cream text-sm font-medium hover:bg-coral transition-colors"
              >
                Retry
              </button>
              <Link to={`/project/${project.slug}`} className="text-sm text-coral underline">
                Back to review
              </Link>
            </div>
          </div>
        )}

        {!err && noRatings && (
          <div className="no-print mt-10 bg-white rounded-card border border-hairline p-10 md:p-12">
            <div className="max-w-xl">
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted mb-2">No data yet</div>
              <h2 className="font-bold text-3xl text-ink mb-3">Rate at least one metric to see your result.</h2>
              <p className="text-muted mb-8 leading-relaxed">
                Once you score a metric, this page will show your weighted final
                score, the AI's comparison, the delta, and a metric-by-metric
                breakdown.
              </p>
              <Link
                to={`/project/${project.slug}`}
                className="inline-flex w-full sm:w-auto items-center justify-center px-7 py-3.5 rounded-pill bg-ink text-cream text-base font-medium hover:bg-coral transition-colors"
              >
                Start rating →
              </Link>
            </div>
          </div>
        )}

        {!err && !noRatings && (
          <ReportView
            project={project}
            summary={summary}
            expertId={expertId}
            reportDate={reportDate}
          />
        )}

        {!err && next && <NextProjectCTA next={next} currentSlug={project.slug} />}

        <div className="mt-6 no-print flex gap-3 flex-wrap text-xs text-muted">
          <Link to={`/project/${project.slug}`} className="hover:text-ink transition-colors">
            ← Back to review
          </Link>
          <span className="text-muted/40">·</span>
          <Link to="/" className="hover:text-ink transition-colors">
            All projects
          </Link>
        </div>
      </main>
    </div>
  );
}

function NextProjectCTA({
  next,
  currentSlug,
}: {
  next: NextSuggestion;
  currentSlug: string;
}) {
  if (next.kind === "all-done") {
    return (
      <section className="no-print mt-12 rounded-card bg-white border-l-[6px] border-greenDark p-8 flex items-center justify-between gap-6 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.3em] text-greenDark mb-1 font-bold">
            All 5 projects rated ✓
          </div>
          <h2 className="font-bold text-2xl text-ink">Ready to send the combined report.</h2>
          <p className="text-sm text-muted mt-1">
            One PDF with all 5 project reports + comments digest.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 rounded-pill bg-white border border-hairline text-ink text-sm font-medium hover:border-coral transition-colors"
          >
            Print this project
          </button>
          <Link
            to="/all-reports"
            className="px-6 py-3 rounded-pill bg-ink text-cream text-sm font-medium hover:bg-coral transition-colors"
          >
            Download combined PDF →
          </Link>
        </div>
      </section>
    );
  }

  const p = next.project!;
  const isInProgress = next.kind === "in-progress";
  const meta = isInProgress
    ? `${next.scored} of ${next.totalMetrics} metrics rated · keep momentum`
    : `${next.totalMetrics} metrics waiting`;

  return (
    <section className="no-print mt-12 rounded-card bg-white border-l-[6px] border-coral p-8 flex items-center justify-between gap-6 flex-wrap">
      <div>
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted mb-1">
          Done with this one?
        </div>
        <h2 className="font-bold text-2xl text-ink">
          Next: <span className="text-coral">{p.name}</span>
        </h2>
        <p className="text-sm text-muted mt-1">{meta}</p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-pill bg-white border border-hairline text-ink text-sm font-medium hover:border-coral transition-colors"
        >
          Print this project
        </button>
        <Link
          to={`/project/${p.slug}`}
          className="px-6 py-3 rounded-pill bg-ink text-cream text-sm font-medium hover:bg-coral transition-colors"
        >
          {isInProgress ? "Continue rating →" : "Start rating →"}
        </Link>
      </div>
      <span className="sr-only">Currently viewing: {currentSlug}</span>
    </section>
  );
}
