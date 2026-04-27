import { useState } from "react";
import { FinalRadar } from "./FinalRadar";
import type { ProjectSummary, ProjectSummaryResponse } from "../lib/types";
import { cn, fmtScore } from "../lib/util";

export function ReportView({
  project,
  summary,
  expertId,
  reportDate,
  firstOnPage = true,
  defaultOpenRows = false,
}: {
  project: ProjectSummary;
  summary: ProjectSummaryResponse | null;
  expertId: string;
  reportDate: string;
  firstOnPage?: boolean;
  defaultOpenRows?: boolean;
}) {
  const expertFinal = summary?.expertFinal;
  const aiFinal = summary?.aiFinal;
  const aiFinalMax = summary?.aiFinalMax ?? 100;
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
    <section className={cn(!firstOnPage && "print:break-before-page")}>
      <header className="mt-6 pb-6 border-b border-hairline print:mt-0 print:pb-2">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-muted mb-2 print:mb-1">
              HOSQ Expert Review
            </div>
            <h1 className="font-bold text-[56px] leading-[0.95] text-ink max-w-4xl print:text-[26px]">
              {project.name}
            </h1>
          </div>
          <div className="text-right text-xs text-muted leading-relaxed print:text-[10px]">
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

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 print:mt-3 print:grid-cols-1 print:gap-2 break-inside-avoid">
        <div className="bg-white rounded-card p-8 border-l-[6px] border-coral print:p-3 print:border-l-[4px]">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted mb-2 print:mb-0">Expert score</div>
              <div className="text-[84px] font-bold text-coral leading-none print:text-[40px]">
                {fmtScore(expertFinal)}
                <span className="text-2xl text-muted font-normal print:text-sm">/5</span>
              </div>
              <div className="mt-3 text-sm text-muted print:mt-1 print:text-[10px]">
                weighted across {summary?.expertProgress ?? 0} of {summary?.totalMetrics ?? 10} metrics
              </div>
            </div>
            <div className="hidden print:block w-[55%] -my-2">
              <FinalRadar data={radarExpert} color="#FF6F55" height={150} />
            </div>
          </div>
          <div className="mt-6 print:hidden">
            <FinalRadar data={radarExpert} color="#FF6F55" />
          </div>
        </div>

        <div className="bg-white rounded-card p-8 border-l-[6px] border-violet print:p-3 print:border-l-[4px]">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted mb-2 print:mb-0">AI score</div>
              {summary?.aiStatus === "evaluated" && aiFinal != null ? (
                <>
                  <div className="text-[84px] font-bold text-violet leading-none print:text-[40px]">
                    ≈&nbsp;{fmtScore(aiNormalised)}
                    <span className="text-2xl text-muted font-normal print:text-sm">/5</span>
                  </div>
                  <div className="mt-3 text-sm text-muted print:mt-1 print:text-[10px]">
                    {aiFinal}/{aiFinalMax} raw
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[84px] font-bold text-muted leading-none print:text-[40px]">—</div>
                  <div className="mt-3 text-sm text-muted print:mt-1 print:text-[10px]">AI analysis not available.</div>
                </>
              )}
            </div>
            {summary?.aiStatus === "evaluated" && aiFinal != null && (
              <div className="hidden print:block w-[55%] -my-2">
                <FinalRadar data={radarAi} color="#C47CF1" height={150} />
              </div>
            )}
          </div>
          {summary?.aiStatus === "evaluated" && aiFinal != null && (
            <div className="mt-6 print:hidden">
              <FinalRadar data={radarAi} color="#C47CF1" />
            </div>
          )}
        </div>
      </div>

      {delta != null && (
        <div className="mt-8 inline-flex items-center gap-3 px-5 py-3 rounded-pill bg-white border border-hairline break-inside-avoid print:mt-3 print:px-3 print:py-1 print:text-[10px]">
          <span className="text-xs uppercase tracking-wider text-muted print:text-[9px]">Delta (expert − AI)</span>
          <span
            className={cn(
              "font-bold text-lg print:text-sm",
              delta > 0.3 ? "text-greenDark" : delta < -0.3 ? "text-coral" : "text-ink",
            )}
          >
            {delta > 0 ? "+" : ""}{delta.toFixed(2)}
          </span>
        </div>
      )}

      {summary?.aiSummary && (
        <div className="mt-10 bg-white rounded-card p-6 border-l-[4px] border-violet break-inside-avoid print:mt-3 print:p-3 print:border-l-[3px]">
          <h3 className="text-[10px] uppercase tracking-wider text-muted font-bold mb-2 print:mb-1">AI summary</h3>
          <p className="text-sm text-ink/90 leading-relaxed whitespace-pre-wrap print:text-[10px] print:leading-snug">{summary.aiSummary}</p>
        </div>
      )}

      <div className="mt-12 print:mt-3">
        <h2 className="font-bold text-2xl text-ink mb-6 print:text-sm print:mb-1 print:uppercase print:tracking-wider print:text-muted">Metric breakdown</h2>
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
              defaultOpen={defaultOpenRows}
            />
          ))}
        </div>
      </div>

      <footer className="mt-4 pt-2 border-t border-hairline hidden print:block text-[9px] text-muted text-center">
        HOSQ Expert Review · {project.name} · Expert {expertId || "—"} · {reportDate}
      </footer>
    </section>
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
  defaultOpen,
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
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const delta = expertScore != null && aiScore != null ? expertScore - aiScore : null;

  return (
    <div className={cn("border-t border-hairline break-inside-avoid", index === 0 && "border-t-0")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-zebra transition print:hover:bg-transparent print:py-1 print:px-2 print:gap-2"
      >
        <span className="shrink-0 flex items-center justify-center h-8 w-8 rounded-pill bg-ink text-cream text-xs font-bold print:h-5 print:w-5 print:text-[9px]">
          {letter}
        </span>
        <span className="flex-1 min-w-0">
          <div className="font-medium text-ink truncate print:text-[10px] print:leading-tight">{name}</div>
          <div className="text-[11px] text-muted print:hidden">weight {weight.toFixed(2)}</div>
        </span>
        <span className="text-sm shrink-0 print:text-[10px] flex items-center gap-2">
          <span>
            <span className="text-muted mr-1">Expert</span>
            <span className="font-bold text-coral">
              {expertScore != null ? expertScore.toFixed(0) : "—"}
            </span>
          </span>
          <span>
            <span className="text-muted mr-1">AI</span>
            <span className="font-bold text-violet">
              {aiScore != null ? aiScore.toFixed(0) : "—"}
            </span>
          </span>
          {delta != null && (
            <span
              className={cn(
                "font-mono text-xs px-2 py-0.5 rounded-pill print:text-[9px] print:px-1.5",
                delta === 0 ? "bg-zebra text-muted" :
                delta > 0   ? "bg-green/10 text-greenDark" :
                              "bg-coral/10 text-coral",
              )}
            >
              {delta > 0 ? "+" : ""}{delta}
            </span>
          )}
        </span>
        <span className="text-muted shrink-0 no-print">{open ? "▲" : "▼"}</span>
      </button>

      {/* Row body — full expert comment + AI strengths/weaknesses side-by-side.
          Hidden on screen when row is collapsed; ALWAYS visible in print so the
          downloaded PDF is fully informative. */}
      <div
        className={cn(
          "px-5 pb-5 bg-zebra/40 print:bg-white print:px-2 print:pb-2 print:pt-1",
          !open && "hidden print:block",
        )}
      >
        <div className="mb-4 print:mb-1">
          <h4 className="text-[10px] uppercase tracking-wider text-muted mb-1">Expert comment</h4>
          {expertComment ? (
            <p className="text-sm text-ink/90 whitespace-pre-wrap print:text-[10px] print:leading-snug">{expertComment}</p>
          ) : (
            <p className="text-sm text-muted italic print:text-[10px]">No comment.</p>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-4 print:gap-3">
          <div>
            <h4 className="text-[10px] uppercase tracking-wider text-greenDark font-bold mb-1">AI strengths</h4>
            <ul className="space-y-1 text-sm print:space-y-0.5 print:text-[10px] print:leading-snug">
              {aiPros.length === 0 ? <li className="text-muted italic">—</li> :
                aiPros.map((p, i) => (
                  <li key={i} className="flex gap-2"><span className="text-greenDark shrink-0">●</span><span className="text-ink/90">{p}</span></li>
                ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-wider text-coral font-bold mb-1">AI weaknesses</h4>
            <ul className="space-y-1 text-sm print:space-y-0.5 print:text-[10px] print:leading-snug">
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
