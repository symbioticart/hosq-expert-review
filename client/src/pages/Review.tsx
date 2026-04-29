import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Header } from "../components/Layout";
import {
  ManuscriptSection,
  ManuscriptTOC,
  useScrollSpy,
} from "../components/Manuscript";
import { ProjectContext, ProjectContextDrawer } from "../components/ProjectContext";
import { ProjectSwitcher } from "../components/ProjectSwitcher";

import { useExpertId } from "../hooks/useExpertId";
import { useProject } from "../hooks/useProject";
import { useProjectsAndMetrics } from "../hooks/useProjects";
import { useAllRatings, useDebouncedSave, useProjectRatings } from "../hooks/useRatings";
import type { Rating } from "../lib/types";

export default function Review() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [expertId] = useExpertId();
  const [ctxOpen, setCtxOpen] = useState(false);

  const { manifest, metrics, loading: metaLoading } = useProjectsAndMetrics();
  const project = manifest?.projects.find((p) => p.slug === slug);

  const { meta, ai, loading: pLoading } = useProject(project?.id ?? null);
  const { ratings: projectRatings, save } = useProjectRatings(expertId, project?.id ?? "");
  const { ratings: allRatings } = useAllRatings(expertId);

  const debouncedSave = useDebouncedSave(save, 350);
  const [savingMetricId, setSavingMetricId] = useState<string | null>(null);

  // Scroll to the metric requested via legacy ?m= once on mount, then drop it.
  useEffect(() => {
    const url = new URL(window.location.href);
    const m = url.searchParams.get("m");
    if (m) {
      url.searchParams.delete("m");
      window.history.replaceState({}, "", url.toString());
      const letter = (metrics?.metrics ?? []).find((x) => x.id === m)?.letter;
      if (letter) {
        // wait for the section to mount
        setTimeout(() => {
          document.getElementById(`metric-${letter}`)?.scrollIntoView({ block: "start" });
        }, 50);
      }
    }
  }, [metrics]);

  const metricIds = useMemo(() => metrics?.metrics.map((m) => m.id) ?? [], [metrics]);
  const activeMetricId = useScrollSpy(metricIds);

  const ratingByMetric = useMemo(() => {
    const map = new Map<string, Rating>();
    for (const r of projectRatings) map.set(r.metricId, r);
    return map;
  }, [projectRatings]);

  if (metaLoading || !manifest || !metrics) {
    return <div className="p-8 text-muted">Loading…</div>;
  }
  if (!project) {
    return (
      <div className="p-8">
        <p className="text-ink mb-4">Project not found.</p>
        <Link to="/" className="text-coral hover:underline">← All projects</Link>
      </div>
    );
  }

  const total = metrics.metrics.length;
  const ratedCount = metrics.metrics.filter((m) => ratingByMetric.has(m.id)).length;
  const allDone = ratedCount === total && total > 0;

  const handleScore = (metricId: string, score: number) => {
    const existing = ratingByMetric.get(metricId);
    setSavingMetricId(metricId);
    debouncedSave(metricId, score, existing?.comment ?? null);
    // optimistic clear of saving state
    setTimeout(() => setSavingMetricId((cur) => (cur === metricId ? null : cur)), 600);
  };

  const handleComment = (metricId: string, comment: string) => {
    const existing = ratingByMetric.get(metricId);
    if (!existing) return; // can't save a comment without a score
    save(metricId, existing.score, comment.trim() ? comment : null);
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="flex items-start min-h-[calc(100vh-72px)]">
        <ManuscriptTOC
          metrics={metrics.metrics}
          ratings={projectRatings}
          activeId={activeMetricId}
          allDone={allDone}
          finalHref={`/project/${project.slug}/final`}
        />

        <main className="flex-1 min-w-0 px-4 py-6 md:px-8 md:py-10 lg:px-16 lg:py-12 max-w-[760px] mx-auto">
          {/* Document title block — like a manuscript front matter */}
          <header className="mb-12 pb-8 border-b border-hairline">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted mb-3">
              HOSQ Expert Review
            </div>
            <h1 className="font-bold text-[44px] md:text-[52px] leading-[1.05] text-ink mb-6">
              {project.name}
            </h1>
            <div className="flex items-baseline justify-between gap-6 flex-wrap text-[12px] text-muted">
              <div>
                <span className="text-muted/70">Section</span>{" "}
                <span className="text-ink font-medium">{ratedCount}</span>
                <span className="text-muted/70"> of {total} rated</span>
              </div>
              <div className="hidden sm:block">
                <ProjectSwitcher
                  projects={manifest.projects}
                  currentId={project.id}
                  metrics={metrics}
                  allRatings={allRatings}
                />
              </div>
            </div>
          </header>

          {pLoading || !meta || !ai ? (
            <ManuscriptLoadingSkeleton count={total} />
          ) : (
            <>
              {metrics.metrics.map((m) => (
                <ManuscriptSection
                  key={m.id}
                  metric={m}
                  rating={ratingByMetric.get(m.id) ?? null}
                  ai={
                    ai.status === "evaluated"
                      ? ai.metrics?.find((x) => x.metricId === m.id) ?? null
                      : null
                  }
                  aiNotEvaluated={ai.status === "not_evaluated"}
                  onScore={(n) => handleScore(m.id, n)}
                  onComment={(c) => handleComment(m.id, c)}
                  saving={savingMetricId === m.id}
                />
              ))}

              <ManuscriptFooter
                allDone={allDone}
                ratedCount={ratedCount}
                total={total}
                onSeeResult={() => navigate(`/project/${project.slug}/final`)}
              />
            </>
          )}
        </main>

        {meta && ai && (
          <>
            <ProjectContext className="hidden xl:flex" meta={meta} ai={ai} />
            <ProjectContextDrawer
              className="xl:hidden"
              meta={meta}
              ai={ai}
              open={ctxOpen}
              onClose={() => setCtxOpen(false)}
            />
            <button
              type="button"
              onClick={() => setCtxOpen(true)}
              aria-label="Open project info"
              title="Project info"
              className="xl:hidden no-print fixed bottom-6 right-6 z-30 h-12 px-5 rounded-pill bg-ink text-cream shadow-lg hover:bg-coral transition text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              Project info
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ManuscriptFooter({
  allDone,
  ratedCount,
  total,
  onSeeResult,
}: {
  allDone: boolean;
  ratedCount: number;
  total: number;
  onSeeResult: () => void;
}) {
  if (allDone) {
    return (
      <div className="mt-16 pt-10 border-t border-hairline flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-greenDark font-bold mb-1">
            All sections rated
          </div>
          <p className="text-sm text-muted">Ready to see the weighted result.</p>
        </div>
        <button
          type="button"
          onClick={onSeeResult}
          className="px-6 py-3 rounded-pill bg-ink text-cream text-sm font-medium hover:bg-coral transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          See result →
        </button>
      </div>
    );
  }
  return (
    <div className="mt-16 pt-10 border-t border-hairline">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted font-medium mb-1">
        End of document
      </div>
      <p className="text-sm text-muted">
        {total - ratedCount} of {total} sections still unrated. Scroll up to fill in
        the gaps.
      </p>
    </div>
  );
}

function ManuscriptLoadingSkeleton({ count }: { count: number }) {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading sections">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="pt-12 first:pt-2 mb-2 border-t first:border-t-0 border-hairline">
          <div className="h-3 w-6 bg-zebra rounded-card mb-3" />
          <div className="h-7 w-2/3 bg-zebra rounded-card mb-3" />
          <div className="h-3 w-24 bg-zebra rounded-card mb-5" />
          <div className="h-3 w-full bg-zebra rounded-card mb-2" />
          <div className="h-3 w-5/6 bg-zebra rounded-card mb-8" />
          <div className="flex gap-1.5 mb-6">
            {[0, 1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="h-9 w-9 rounded-pill bg-zebra" />
            ))}
          </div>
          <div className="h-px w-full bg-hairline mt-10" />
        </div>
      ))}
    </div>
  );
}
