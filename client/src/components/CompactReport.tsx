import type { ProjectSummary, ProjectSummaryResponse } from "../lib/types";
import { cn, fmtScore } from "../lib/util";

interface Loaded {
  project: ProjectSummary;
  summary: ProjectSummaryResponse | null;
}

export function CompactDashboard({
  reports,
  expertId,
  expertName,
  reportDate,
}: {
  reports: Loaded[];
  expertId: string;
  expertName?: string | null;
  reportDate: string;
}) {
  return (
    <section className="print:break-after-page">
      <header className="flex items-baseline justify-between border-b border-hairline pb-3 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted mb-1">
            HOSQ Expert Review — Summary
          </div>
          <h1 className="font-bold text-2xl text-ink print:text-xl">
            {reports.length} projects
          </h1>
        </div>
        <div className="text-right text-[11px] text-muted leading-relaxed">
          <div><span className="text-muted/70">Expert</span> <span className="text-ink">{expertName || expertId || "—"}</span></div>
          <div><span className="text-muted/70">Date</span> <span className="text-ink">{reportDate}</span></div>
        </div>
      </header>

      <div className="divide-y divide-hairline">
        {reports.map(({ project, summary }) => (
          <DashboardRow key={project.id} project={project} summary={summary} />
        ))}
      </div>

      <div className="mt-4 flex items-center gap-5 text-[10px] text-muted">
        <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm bg-coral inline-block" /> Expert</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm bg-violet inline-block" /> AI</span>
        <span>Bars show per-metric score (0–5).</span>
      </div>
    </section>
  );
}

function DashboardRow({
  project,
  summary,
}: {
  project: ProjectSummary;
  summary: ProjectSummaryResponse | null;
}) {
  const expertFinal = summary?.expertFinal ?? null;
  const aiFinal = summary?.aiFinal ?? null;
  const aiFinalMax = summary?.aiFinalMax ?? 100;
  const aiNormalised = aiFinal != null ? (aiFinal / aiFinalMax) * 5 : null;
  const delta = expertFinal != null && aiNormalised != null ? expertFinal - aiNormalised : null;
  const byMetric = summary?.byMetric ?? [];
  const aiOk = summary?.aiStatus === "evaluated";

  return (
    <div className="grid grid-cols-12 gap-4 py-3 break-inside-avoid">
      <div className="col-span-5 min-w-0">
        <div className="font-bold text-ink text-[14px] leading-tight truncate">{project.name}</div>
        <div className="text-[10px] text-muted mt-0.5">
          {summary?.expertProgress ?? 0} / {summary?.totalMetrics ?? 10} metrics rated
        </div>
        <div className="mt-2 flex items-baseline gap-3">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-muted">You</div>
            <div className="text-[22px] font-bold text-coral leading-none">
              {fmtScore(expertFinal)}<span className="text-xs text-muted font-normal">/5</span>
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-muted">AI</div>
            <div className="text-[22px] font-bold text-violet leading-none">
              {aiOk && aiNormalised != null ? (
                <>≈ {fmtScore(aiNormalised)}<span className="text-xs text-muted font-normal">/5</span></>
              ) : "—"}
            </div>
          </div>
          {delta != null && (
            <div
              className={cn(
                "font-mono text-[11px] px-2 py-0.5 rounded-pill",
                delta > 0.3 ? "bg-green/10 text-greenDark" :
                delta < -0.3 ? "bg-coral/10 text-coral" :
                "bg-zebra text-muted",
              )}
              title="Delta (expert − AI)"
            >
              Δ {delta > 0 ? "+" : ""}{delta.toFixed(1)}
            </div>
          )}
        </div>
      </div>

      <div className="col-span-7 min-w-0">
        <MetricBars byMetric={byMetric} aiOk={aiOk} />
      </div>
    </div>
  );
}

function MetricBars({
  byMetric,
  aiOk,
}: {
  byMetric: ProjectSummaryResponse["byMetric"];
  aiOk: boolean;
}) {
  return (
    <div className="flex items-end gap-2 h-full min-h-[68px]">
      {byMetric.map((m) => {
        const expertPct = m.expertScore != null ? (m.expertScore / 5) * 100 : 0;
        const aiPct = aiOk && m.aiScore != null ? (m.aiScore / 5) * 100 : 0;
        return (
          <div key={m.metricId} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="relative w-full h-14 rounded-sm bg-zebra/70 overflow-hidden flex items-end gap-[2px] px-[2px] pb-[2px]">
              <div
                className="flex-1 bg-coral rounded-[1px]"
                style={{ height: `${expertPct}%` }}
                title={`Expert ${m.expertScore ?? "—"}/5`}
              />
              <div
                className={cn(
                  "flex-1 rounded-[1px]",
                  aiOk && m.aiScore != null ? "bg-violet" : "bg-hairline",
                )}
                style={{ height: `${aiPct}%` }}
                title={aiOk ? `AI ${m.aiScore ?? "—"}/5` : "AI n/a"}
              />
            </div>
            <div className="text-[9px] font-bold text-muted">{m.letter}</div>
          </div>
        );
      })}
    </div>
  );
}

export function CompactCommentsDigest({
  reports,
  expertId,
  expertName,
  reportDate,
}: {
  reports: Loaded[];
  expertId: string;
  expertName?: string | null;
  reportDate: string;
}) {
  const withComments = reports
    .map((r) => ({
      ...r,
      comments: (r.summary?.byMetric ?? []).filter((m) => m.expertComment && m.expertComment.trim()),
    }))
    .filter((r) => r.comments.length > 0);

  if (withComments.length === 0) return null;

  return (
    <section className="print:break-before-page mt-10 print:mt-0">
      <header className="flex items-baseline justify-between border-b border-hairline pb-3 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted mb-1">
            Expert comments digest
          </div>
          <h2 className="font-bold text-xl text-ink print:text-lg">
            Notes by project
          </h2>
        </div>
        <div className="text-right text-[11px] text-muted leading-relaxed">
          <div><span className="text-muted/70">Expert</span> <span className="text-ink">{expertName || expertId || "—"}</span></div>
          <div><span className="text-muted/70">Date</span> <span className="text-ink">{reportDate}</span></div>
        </div>
      </header>

      <div className="space-y-4">
        {withComments.map(({ project, comments }) => (
          <div key={project.id} className="break-inside-avoid">
            <h3 className="font-bold text-ink text-[13px] mb-2">{project.name}</h3>
            <ul className="space-y-1.5 pl-1">
              {comments.map((m) => (
                <li key={m.metricId} className="flex gap-2 text-[11px] leading-snug">
                  <span className="shrink-0 flex items-center justify-center h-4 w-4 rounded-pill bg-ink text-cream text-[9px] font-bold mt-[1px]">
                    {m.letter}
                  </span>
                  <span className="shrink-0 text-muted w-28 truncate">{m.nameEn}</span>
                  <span className="shrink-0 font-bold text-coral">{m.expertScore?.toFixed(0) ?? "—"}</span>
                  <span className="text-ink/85 whitespace-pre-wrap">{m.expertComment}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
