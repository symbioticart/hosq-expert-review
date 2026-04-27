import { useEffect, useMemo, useRef, useState } from "react";
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
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse h-[280px] bg-white/60 rounded-card border border-transparent"
                aria-hidden
              />
            ))}
          </div>
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

        {/* Vault: data portability — promoted from the old footer to a labelled card so
            users who switch browsers actually find it. */}
        <section className="mt-16 bg-white rounded-card p-6 border border-hairline">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="max-w-md">
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted mb-1">Backup &amp; restore</div>
              <h2 className="font-bold text-ink text-lg mb-1">Your ratings, portable</h2>
              <p className="text-sm text-muted leading-relaxed">
                Download a single vault file with everything you've rated, then
                restore it from any browser — no account needed.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onDownload}
                className="px-4 py-2 rounded-pill bg-white border border-hairline text-ink hover:border-coral hover:text-coral transition-colors text-sm font-medium"
              >
                Download my vault
              </button>
              <label className="px-4 py-2 rounded-pill bg-white border border-hairline text-ink hover:border-coral hover:text-coral transition-colors text-sm font-medium cursor-pointer">
                Restore from file
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json,.hosq"
                  className="hidden"
                  onChange={onRestore}
                />
              </label>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

