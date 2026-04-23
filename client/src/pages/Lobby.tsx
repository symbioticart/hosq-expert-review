import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Layout";
import { ProjectCard } from "../components/ProjectCard";
import { useExpertIdentity } from "../hooks/useExpertId";
import { useProjectsAndMetrics } from "../hooks/useProjects";
import { useAllRatings } from "../hooks/useRatings";
import { loadAiEval } from "../lib/api";
import { buildVault, installVault } from "../lib/storage";
import type { Rating } from "../lib/types";

export default function Lobby() {
  const { expert } = useExpertIdentity();
  const expertId = expert?.id ?? "";
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

  const fileRef = useRef<HTMLInputElement | null>(null);

  const onDownload = () => {
    if (!expert) return;
    const v = buildVault(expert);
    const blob = new Blob([JSON.stringify(v, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date(v.exportedAt).toISOString().slice(0, 10);
    a.href = url;
    a.download = `hosq-vault-${expert.id}-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const restored = installVault(JSON.parse(text));
      alert(`Restored ${restored.name}. Reloading…`);
      window.location.reload();
    } catch (ex) {
      alert(ex instanceof Error ? ex.message : "Could not read vault file.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (error) return <div className="p-8 text-red-600">Failed to load: {error.message}</div>;

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="max-w-[1400px] mx-auto px-8 py-16">
        <div className="max-w-3xl mb-14">
          <h1 className="font-bold text-5xl leading-tight text-ink mb-4">
            {expert ? <>Hi, <span className="text-coral">{expert.name}</span>.</> : "Project expert review"}
          </h1>
          <p className="text-lg text-muted">
            Go through all five projects. Your progress is saved on this device
            as you rate — and mirrored on the server so you can come back on any
            browser with the same name.
          </p>
          {expectedTotal > 0 && (
            <div className="mt-8 flex items-end gap-6 flex-wrap">
              <div className="flex-1 min-w-[260px] max-w-md">
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
              <DownloadAllButton done={scoredTotal} total={expectedTotal} />
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

        <div className="mt-20 pt-8 border-t border-hairline flex items-center gap-3 text-xs text-muted flex-wrap">
          <span>Backup your session:</span>
          <button
            type="button"
            onClick={onDownload}
            className="px-3 py-1.5 rounded-pill bg-white border border-hairline text-ink hover:border-coral transition"
          >
            Download my vault
          </button>
          <label className="px-3 py-1.5 rounded-pill bg-white border border-hairline text-ink hover:border-coral transition cursor-pointer">
            Restore from file
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json,.hosq"
              className="hidden"
              onChange={onRestore}
            />
          </label>
          <span className="opacity-70">
            — one file with all your ratings, portable between devices.
          </span>
        </div>
      </main>
    </div>
  );
}

function DownloadAllButton({ done, total }: { done: number; total: number }) {
  if (done < total) return null;
  return (
    <Link
      to="/all-reports"
      className="inline-flex items-center px-5 py-2.5 rounded-pill bg-ink text-cream hover:bg-coral transition text-sm font-medium"
    >
      Download all 5 reports (PDF)
    </Link>
  );
}
