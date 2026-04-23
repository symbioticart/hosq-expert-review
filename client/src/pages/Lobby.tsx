import { useEffect, useMemo, useState } from "react";
import { Header } from "../components/Layout";
import { ProjectCard } from "../components/ProjectCard";
import { useExpertId } from "../hooks/useExpertId";
import { useProjectsAndMetrics } from "../hooks/useProjects";
import { useAllRatings } from "../hooks/useRatings";
import { loadAiEval } from "../lib/api";
import type { Rating } from "../lib/types";

export default function Lobby() {
  const [expertId] = useExpertId();
  const { manifest, metrics, loading, error } = useProjectsAndMetrics();
  const { ratings } = useAllRatings(expertId);
  const [aiFinals, setAiFinals] = useState<Record<string, number | null>>({});

  useEffect(() => {
    if (!manifest) return;
    (async () => {
      const entries = await Promise.all(
        manifest.projects.map(async (p) => {
          try {
            const a = await loadAiEval(p.id);
            if (a.status !== "evaluated" || a.finalScore == null || !a.finalScoreMax) {
              return [p.id, null] as const;
            }
            // normalise to 0..5 scale for lobby mini-stat
            return [p.id, (a.finalScore / a.finalScoreMax) * 5] as const;
          } catch {
            return [p.id, null] as const;
          }
        }),
      );
      setAiFinals(Object.fromEntries(entries));
    })();
  }, [manifest]);

  const ratingsByProject = useMemo(() => {
    const m: Record<string, Rating[]> = {};
    for (const r of ratings) {
      (m[r.projectId] ??= []).push(r);
    }
    return m;
  }, [ratings]);

  const totalMetrics = metrics?.metrics.length ?? 10;
  const scoredTotal  = ratings.filter((r) => r.metricId !== "final").length;
  const expectedTotal = (manifest?.projects.length ?? 0) * totalMetrics;

  if (error) return <div className="p-8 text-red-600">Failed to load: {error.message}</div>;

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="max-w-[1400px] mx-auto px-8 py-16">
        <div className="max-w-3xl mb-14">
          <h1 className="font-bold text-5xl leading-tight text-ink mb-4">
            Project expert review
          </h1>
          <p className="text-lg text-muted">
            Go through all five projects. Your progress is saved automatically.
            Choose a project to start or resume the evaluation.
          </p>
          {expectedTotal > 0 && (
            <div className="mt-8 max-w-md">
              <div className="flex items-baseline justify-between text-xs text-muted mb-2">
                <span>Overall progress</span>
                <span>
                  <strong className="text-ink">{scoredTotal}</strong> of {expectedTotal} ratings
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-blush overflow-hidden">
                <div
                  className="h-full bg-coral transition-all"
                  style={{ width: `${Math.min(100, (scoredTotal / expectedTotal) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-muted">Loading projects…</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {manifest!.projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                ratings={ratingsByProject[p.id] ?? []}
                totalMetrics={totalMetrics}
                aiFinalScore={aiFinals[p.id]}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
