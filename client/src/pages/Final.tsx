import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { FinalRadar } from "../components/FinalRadar";
import { Header } from "../components/Layout";
import { useExpertId } from "../hooks/useExpertId";
import { useProjectsAndMetrics } from "../hooks/useProjects";
import { fetchSummary } from "../lib/api";
import type { ProjectSummaryResponse } from "../lib/types";
import { cn, fmtScore } from "../lib/util";

export default function Final() {
  const { slug = "" } = useParams();
  const [expertId] = useExpertId();
  const { manifest, metrics, loading } = useProjectsAndMetrics();
  const [summary, setSummary] = useState<ProjectSummaryResponse | null>(null);

  const project = manifest?.projects.find((p) => p.slug === slug);

  useEffect(() => {
    if (!project) return;
    fetchSummary(expertId, project.id).then(setSummary).catch(console.error);
  }, [project, expertId]);

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

  const expertFinal = summary?.expertFinal;          // 0..5
  const aiFinal     = summary?.aiFinal;              // 0..100
  const aiFinalMax  = summary?.aiFinalMax ?? 100;
  const aiNormalised = aiFinal != null ? (aiFinal / aiFinalMax) * 5 : null;
  const delta =
    expertFinal != null && aiNormalised != null ? expertFinal - aiNormalised : null;

  const byMetric = summary?.byMetric ?? [];

  const radarExpert = byMetric.map((m) => ({
    metric: m.nameEn, letter: m.letter, value: m.expertScore ?? 0,
  }));
  const radarAi = byMetric.map((m) => ({
    metric: m.nameEn,
    letter: m.letter,
    value: m.aiScore != null && summary?.aiStatus === "evaluated" ? m.aiScore : 0,
  }));

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="max-w-[1200px] mx-auto px-10 py-16">
        <Link to={`/project/${project.slug}`} className="no-print text-xs text-muted hover:text-ink transition">
          ← Back to review
        </Link>

        <div className="mt-6">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted mb-2">Project</div>
          <h1 className="font-bold text-[72px] leading-[0.95] text-ink max-w-4xl">
            {project.name}
          </h1>
          <p className="mt-6 text-lg text-muted">Expert review summary</p>
        </div>

        <section className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-card p-8 border-l-[6px] border-coral">
            <div className="text-xs uppercase tracking-wider text-muted mb-2">Your score</div>
            <div className="text-[84px] font-bold text-coral leading-none">
              {fmtScore(expertFinal)}
              <span className="text-2xl text-muted font-normal">/5</span>
            </div>
            <div className="mt-3 text-sm text-muted">
              based on {summary?.expertProgress ?? 0} of {summary?.totalMetrics ?? 10} metrics (weighted)
            </div>
            <div className="mt-6">
              <FinalRadar data={radarExpert} color="#FF6F55" />
            </div>
          </div>

          <div className="bg-white rounded-card p-8 border-l-[6px] border-violet">
            <div className="text-xs uppercase tracking-wider text-muted mb-2">AI score</div>
            {summary?.aiStatus === "evaluated" && aiFinal != null ? (
              <>
                <div className="text-[84px] font-bold text-violet leading-none">
                  {aiFinal}
                  <span className="text-2xl text-muted font-normal">/{aiFinalMax}</span>
                </div>
                <div className="mt-3 text-sm text-muted">
                  ≈ {fmtScore(aiNormalised)}/5 (normalised)
                </div>
                <div className="mt-6">
                  <FinalRadar data={radarAi} color="#C47CF1" />
                </div>
              </>
            ) : (
              <>
                <div className="text-[84px] font-bold text-muted leading-none">—</div>
                <div className="mt-3 text-sm text-muted">AI analysis not available</div>
              </>
            )}
          </div>
        </section>

        {delta != null && (
          <div className="mt-10 inline-flex items-center gap-3 px-5 py-3 rounded-pill bg-white">
            <span className="text-xs uppercase tracking-wider text-muted">Delta (you − AI)</span>
            <span
              className={cn(
                "font-bold text-lg",
                delta > 0.3 ? "text-green" : delta < -0.3 ? "text-coral" : "text-ink",
              )}
            >
              {delta > 0 ? "+" : ""}{delta.toFixed(2)}
            </span>
          </div>
        )}

        <section className="mt-16">
          <h2 className="font-bold text-2xl text-ink mb-6">Metric breakdown</h2>
          <div className="bg-white rounded-card overflow-hidden">
            {byMetric.map((m, i) => (
              <MetricRow
                key={m.metricId}
                index={i}
                letter={m.letter}
                name={m.nameEn}
                expertScore={m.expertScore}
                expertComment={m.expertComment}
                aiScore={m.aiScore}
                aiPros={m.aiPros}
                aiCons={m.aiCons}
              />
            ))}
          </div>
        </section>

        <div className="mt-12 no-print flex gap-3 flex-wrap">
          <Link
            to={`/project/${project.slug}`}
            className="px-6 py-3 rounded-pill bg-white border border-hairline text-ink hover:border-coral transition text-sm font-medium"
          >
            ← Back to review
          </Link>
          <Link
            to="/"
            className="px-6 py-3 rounded-pill bg-ink text-cream hover:bg-coral transition text-sm font-medium"
          >
            All projects
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-6 py-3 rounded-pill bg-white border border-hairline text-ink hover:border-coral transition text-sm font-medium"
          >
            Export PDF
          </button>
        </div>
      </main>
    </div>
  );
}

function MetricRow({
  index,
  letter,
  name,
  expertScore,
  expertComment,
  aiScore,
  aiPros,
  aiCons,
}: {
  index: number;
  letter: string;
  name: string;
  expertScore: number | null;
  expertComment: string | null;
  aiScore: number | null;
  aiPros: string[];
  aiCons: string[];
}) {
  const [open, setOpen] = useState(false);
  const delta = expertScore != null && aiScore != null ? expertScore - aiScore : null;

  return (
    <div className={cn("border-t border-hairline", index === 0 && "border-t-0")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-zebra transition"
      >
        <span className="shrink-0 flex items-center justify-center h-8 w-8 rounded-pill bg-ink text-cream text-xs font-bold">
          {letter}
        </span>
        <span className="flex-1 font-medium text-ink">{name}</span>
        <span className="text-sm">
          <span className="text-muted mr-1">You</span>
          <span className="font-bold text-coral mr-3">
            {expertScore != null ? expertScore.toFixed(0) : "—"}
          </span>
          <span className="text-muted mr-1">AI</span>
          <span className="font-bold text-violet mr-3">
            {aiScore != null ? aiScore.toFixed(0) : "—"}
          </span>
          {delta != null && (
            <span
              className={cn(
                "font-mono text-xs px-2 py-0.5 rounded-pill",
                delta === 0 ? "bg-zebra text-muted" :
                delta > 0   ? "bg-green/10 text-green" :
                              "bg-coral/10 text-coral",
              )}
            >
              {delta > 0 ? "+" : ""}{delta}
            </span>
          )}
        </span>
        <span className="text-muted shrink-0">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 bg-zebra/40">
          {expertComment && (
            <div className="mb-4">
              <h4 className="text-[10px] uppercase tracking-wider text-muted mb-1">Your comment</h4>
              <p className="text-sm text-ink/90 whitespace-pre-wrap">{expertComment}</p>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-green font-bold mb-1">Strengths</h4>
              <ul className="space-y-1 text-sm">
                {aiPros.length === 0 ? <li className="text-muted italic">—</li> :
                  aiPros.map((p, i) => (
                    <li key={i} className="flex gap-2"><span className="text-green shrink-0">●</span><span className="text-ink/90">{p}</span></li>
                  ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-coral font-bold mb-1">Weaknesses</h4>
              <ul className="space-y-1 text-sm">
                {aiCons.length === 0 ? <li className="text-muted italic">—</li> :
                  aiCons.map((c, i) => (
                    <li key={i} className="flex gap-2"><span className="text-coral shrink-0">●</span><span className="text-ink/90">{c}</span></li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
