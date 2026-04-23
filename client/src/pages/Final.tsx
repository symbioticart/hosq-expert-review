import { useEffect, useMemo, useState } from "react";
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

  const expertFinal = summary?.expertFinal;
  const aiFinal     = summary?.aiFinal;
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
    <div className="min-h-screen bg-cream print:bg-white">
      <div className="no-print"><Header /></div>

      <main className="max-w-[1200px] mx-auto px-10 py-12 print:px-0 print:py-0 print:max-w-none">
        <Link to={`/project/${project.slug}`} className="no-print text-xs text-muted hover:text-ink transition">
          ← Back to review
        </Link>

        <header className="mt-6 pb-6 border-b border-hairline print:mt-0">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="text-[11px] uppercase tracking-[0.3em] text-muted mb-2">
                HOSQ Expert Review
              </div>
              <h1 className="font-bold text-[56px] leading-[0.95] text-ink max-w-4xl print:text-[36px]">
                {project.name}
              </h1>
            </div>
            <div className="text-right text-xs text-muted leading-relaxed">
              <div><span className="text-muted/70">Expert ID</span> <span className="text-ink font-mono">{expertId || "—"}</span></div>
              <div><span className="text-muted/70">Date</span> <span className="text-ink">{reportDate}</span></div>
              <div>
                <span className="text-muted/70">Progress</span>{" "}
                <span className="text-ink">
                  {summary?.expertProgress ?? 0} / {summary?.totalMetrics ?? 10}
                </span>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-1 print:gap-4 break-inside-avoid">
          <div className="bg-white rounded-card p-8 border-l-[6px] border-coral print:p-4">
            <div className="text-xs uppercase tracking-wider text-muted mb-2">Expert score</div>
            <div className="text-[84px] font-bold text-coral leading-none print:text-[56px]">
              {fmtScore(expertFinal)}
              <span className="text-2xl text-muted font-normal">/5</span>
            </div>
            <div className="mt-3 text-sm text-muted">
              weighted across {summary?.expertProgress ?? 0} of {summary?.totalMetrics ?? 10} metrics
            </div>
            <div className="mt-6">
              <FinalRadar data={radarExpert} color="#FF6F55" />
            </div>
          </div>

          <div className="no-print bg-white rounded-card p-8 border-l-[6px] border-violet">
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
          <div className="no-print mt-8 inline-flex items-center gap-3 px-5 py-3 rounded-pill bg-white border border-hairline break-inside-avoid">
            <span className="text-xs uppercase tracking-wider text-muted">Delta (expert − AI)</span>
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

        {summary?.aiSummary && (
          <section className="no-print mt-10 bg-white rounded-card p-6 border-l-[4px] border-violet break-inside-avoid">
            <h3 className="text-[10px] uppercase tracking-wider text-muted font-bold mb-2">AI summary</h3>
            <p className="text-sm text-ink/90 leading-relaxed whitespace-pre-wrap">{summary.aiSummary}</p>
          </section>
        )}

        <section className="mt-12 print:mt-8 print:break-before-page">
          <h2 className="font-bold text-2xl text-ink mb-6 print:text-xl">Metric breakdown</h2>
          <div className="bg-white rounded-card overflow-hidden">
            {byMetric.map((m, i) => (
              <MetricRow
                key={m.metricId}
                index={i}
                letter={m.letter}
                name={m.nameEn}
                weight={m.weight}
                expertScore={m.expertScore}
                expertComment={m.expertComment}
                aiScore={m.aiScore}
                aiPros={m.aiPros}
                aiCons={m.aiCons}
              />
            ))}
          </div>
        </section>

        <footer className="mt-12 pt-4 border-t border-hairline hidden print:block text-[10px] text-muted text-center">
          HOSQ Expert Review · {project.name} · Expert {expertId || "—"} · {reportDate}
        </footer>

        <div className="mt-12 no-print flex gap-3 flex-wrap">
          <Link
            to={`/project/${project.slug}`}
            className="px-6 py-3 rounded-pill bg-white border border-hairline text-ink hover:border-coral transition text-sm font-medium"
          >
            ← Back to review
          </Link>
          <Link
            to="/"
            className="px-6 py-3 rounded-pill bg-white border border-hairline text-ink hover:border-coral transition text-sm font-medium"
          >
            All projects
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-6 py-3 rounded-pill bg-ink text-cream hover:bg-coral transition text-sm font-medium"
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
  weight,
  expertScore,
  expertComment,
  aiScore,
  aiPros,
  aiCons,
}: {
  index: number;
  letter: string;
  name: string;
  weight: number;
  expertScore: number | null;
  expertComment: string | null;
  aiScore: number | null;
  aiPros: string[];
  aiCons: string[];
}) {
  const [open, setOpen] = useState(false);
  const delta = expertScore != null && aiScore != null ? expertScore - aiScore : null;

  return (
    <div className={cn("border-t border-hairline break-inside-avoid", index === 0 && "border-t-0")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-zebra transition print:hover:bg-transparent"
      >
        <span className="shrink-0 flex items-center justify-center h-8 w-8 rounded-pill bg-ink text-cream text-xs font-bold">
          {letter}
        </span>
        <span className="flex-1 min-w-0">
          <div className="font-medium text-ink truncate">{name}</div>
          <div className="text-[11px] text-muted">weight {weight.toFixed(2)}</div>
        </span>
        <span className="text-sm shrink-0">
          <span className="text-muted mr-1">Expert</span>
          <span className="font-bold text-coral mr-3">
            {expertScore != null ? expertScore.toFixed(0) : "—"}
          </span>
          <span className="no-print">
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
        </span>
        <span className="text-muted shrink-0 no-print">{open ? "▲" : "▼"}</span>
      </button>

      <div className={cn("px-5 pb-5 bg-zebra/40 print:bg-white print:px-3 print:pb-3", !open && "hidden print:block")}>
        <div className="mb-4">
          <h4 className="text-[10px] uppercase tracking-wider text-muted mb-1">Expert comment</h4>
          {expertComment ? (
            <p className="text-sm text-ink/90 whitespace-pre-wrap">{expertComment}</p>
          ) : (
            <p className="text-sm text-muted italic">No comment.</p>
          )}
        </div>
        <div className="no-print grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-[10px] uppercase tracking-wider text-green font-bold mb-1">AI strengths</h4>
            <ul className="space-y-1 text-sm">
              {aiPros.length === 0 ? <li className="text-muted italic">—</li> :
                aiPros.map((p, i) => (
                  <li key={i} className="flex gap-2"><span className="text-green shrink-0">●</span><span className="text-ink/90">{p}</span></li>
                ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-wider text-coral font-bold mb-1">AI weaknesses</h4>
            <ul className="space-y-1 text-sm">
              {aiCons.length === 0 ? <li className="text-muted italic">—</li> :
                aiCons.map((c, i) => (
                  <li key={i} className="flex gap-2"><span className="text-coral shrink-0">●</span><span className="text-ink/90">{c}</span></li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
