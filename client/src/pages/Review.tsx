import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { AiReveal } from "../components/AiReveal";
import { Header } from "../components/Layout";
import {
  HowBlock,
  MetricHeader,
  Toggle,
} from "../components/MetricBlock";
import { MetricStepper } from "../components/MetricStepper";
import { ProjectContext, ProjectContextDrawer } from "../components/ProjectContext";
import { ProjectSwitcher } from "../components/ProjectSwitcher";
import { ScoreScale } from "../components/ScoreScale";

import { useExpertId } from "../hooks/useExpertId";
import { useProject } from "../hooks/useProject";
import { useProjectsAndMetrics } from "../hooks/useProjects";
import { useAllRatings, useDebouncedSave, useProjectRatings } from "../hooks/useRatings";
import { cn } from "../lib/util";

export default function Review() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [expertId] = useExpertId();

  const [ctxOpen, setCtxOpen] = useState(false);

  const { manifest, metrics, loading: metaLoading } = useProjectsAndMetrics();
  const project = manifest?.projects.find((p) => p.slug === slug);

  const { meta, ai, loading: pLoading } = useProject(project?.id ?? null);
  const { ratings: projectRatings, save } = useProjectRatings(expertId, project?.id ?? "");
  const { ratings: allRatings } = useAllRatings(expertId);

  const debouncedSave = useDebouncedSave(save, 500);

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

  const activeMetricId = params.get("m") ?? metrics.metrics[0].id;
  const activeIndex    = metrics.metrics.findIndex((m) => m.id === activeMetricId);
  const activeMetric   = metrics.metrics[activeIndex >= 0 ? activeIndex : 0];
  const isLast         = activeIndex === metrics.metrics.length - 1;

  const ratedMetricIds = new Set(projectRatings.map((r) => r.metricId));
  const allDoneInProject = metrics.metrics.every((m) => ratedMetricIds.has(m.id));

  const existingRating = projectRatings.find((r) => r.metricId === activeMetric.id) ?? null;

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="flex items-start min-h-[calc(100vh-72px)]">
        <LeftSidebar
          className="hidden lg:flex"
          projects={manifest.projects}
          projectId={project.id}
          projectSlug={project.slug}
          metrics={metrics.metrics}
          ratings={projectRatings}
          activeMetricId={activeMetric.id}
          allRatings={allRatings}
        />

        <main className="flex-1 min-w-0 px-4 py-6 md:px-12 md:py-10 lg:px-16 lg:py-14 max-w-[820px] mx-auto">
          <MobileMetricBar
            metrics={metrics.metrics}
            ratings={projectRatings}
            activeMetricId={activeMetric.id}
            projectSlug={project.slug}
          />
          {pLoading || !meta || !ai ? (
            <MetricSkeleton />
          ) : (
            <MetricEditor
              key={activeMetric.id}
              metric={activeMetric}
              aiMetric={
                ai.status === "evaluated"
                  ? ai.metrics?.find((x) => x.metricId === activeMetric.id) ?? null
                  : null
              }
              aiNotEvaluated={ai.status === "not_evaluated"}
              aiAnalysisPdf={meta.aiAnalysisPdf}
              existingScore={existingRating?.score ?? null}
              existingComment={existingRating?.comment ?? ""}
              onChange={(score, comment) => {
                debouncedSave(activeMetric.id, score, comment || null);
              }}
              onSaveAndReveal={(score, comment) => {
                save(activeMetric.id, score, comment || null);
              }}
              onNext={() => {
                if (isLast) navigate(`/project/${project.slug}/final`);
                else setParams({ m: metrics.metrics[activeIndex + 1].id });
              }}
              onSeeResult={() => navigate(`/project/${project.slug}/final`)}
              isLast={isLast}
              allDoneInProject={allDoneInProject}
            />
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

function LeftSidebar({
  className,
  projects,
  projectId,
  projectSlug,
  metrics,
  ratings,
  activeMetricId,
  allRatings,
}: {
  className?: string;
  projects: import("../lib/types").ProjectSummary[];
  projectId: string;
  projectSlug: string;
  metrics: import("../lib/types").MetricDef[];
  ratings: import("../lib/types").Rating[];
  activeMetricId: string;
  allRatings: import("../lib/types").Rating[];
}) {
  const scored = ratings.filter((r) => r.metricId !== "final");
  const done = scored.length;
  const total = metrics.length;
  const allDone = done === total && total > 0;

  const weightSumScored = scored.reduce((s, r) => {
    const m = metrics.find((x) => x.id === r.metricId);
    return m ? s + m.weight : s;
  }, 0);
  const weightedScore = scored.reduce((s, r) => {
    const m = metrics.find((x) => x.id === r.metricId);
    return m ? s + r.score * m.weight : s;
  }, 0);
  const expertTeaser = weightSumScored > 0 ? weightedScore / weightSumScored : null;

  return (
    <aside className={cn("no-print sticky top-[72px] h-[calc(100vh-72px)] w-[260px] shrink-0 border-r border-hairline bg-cream flex-col", className ?? "flex")}>
      <div className="p-4">
        <Link to="/" className="text-xs text-muted hover:text-ink transition">← All projects</Link>
      </div>
      <div className="px-4">
        <ProjectSwitcher
          projects={projects}
          currentId={projectId}
          metrics={{ metrics }}
          allRatings={allRatings}
        />
      </div>
      <div className="px-4 pt-4 pb-1">
        <div className="text-[10px] uppercase tracking-wider text-muted">Metrics</div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <MetricStepper
          metrics={metrics}
          ratings={ratings}
          activeMetricId={activeMetricId}
          projectSlug={projectSlug}
        />
      </div>
      <div className="px-4 pt-3 pb-5 border-t border-hairline">
        <FinalSidebarLink
          projectSlug={projectSlug}
          allDone={allDone}
          done={done}
          total={total}
          teaser={expertTeaser}
        />
      </div>
    </aside>
  );
}

function FinalSidebarLink({
  projectSlug,
  allDone,
  done,
  total,
  teaser,
}: {
  projectSlug: string;
  allDone: boolean;
  done: number;
  total: number;
  teaser: number | null;
}) {
  const inner = (
    <>
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "shrink-0 flex items-center justify-center h-7 w-7 rounded-pill text-xs font-bold",
            allDone ? "bg-coral text-white" : "bg-zebra text-muted",
          )}
        >
          ★
        </span>
        <span className={cn("text-sm font-medium", allDone ? "text-ink" : "text-muted")}>
          {allDone ? "See result" : "Result"}
        </span>
      </span>
      {allDone ? (
        <span className="text-coral text-sm font-bold">{teaser?.toFixed(1)}/5 →</span>
      ) : teaser != null ? (
        <span className="text-[11px] text-muted">≈ {teaser.toFixed(1)}/5</span>
      ) : null}
    </>
  );

  if (allDone) {
    return (
      <Link
        to={`/project/${projectSlug}/final`}
        className="flex items-center justify-between gap-2 rounded-card p-2 border border-coral hover:bg-coral/10 transition"
      >
        {inner}
      </Link>
    );
  }
  return (
    <div
      className="flex items-center justify-between gap-2 rounded-card p-2 border border-dashed border-hairline cursor-not-allowed opacity-80"
      title={`Complete all ${total} metrics first — ${done}/${total} done`}
    >
      {inner}
    </div>
  );
}

function MetricSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-live="polite" aria-label="Loading metric">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-14 w-14 rounded-pill bg-zebra" />
        <div>
          <div className="h-6 w-48 bg-zebra rounded-card mb-2" />
          <div className="h-3 w-20 bg-zebra rounded-card" />
        </div>
      </div>
      <div className="h-4 w-full bg-zebra rounded-card mb-2" />
      <div className="h-4 w-5/6 bg-zebra rounded-card mb-8" />
      <div className="h-4 w-32 bg-zebra rounded-card mb-3" />
      <div className="flex gap-2 mb-8">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 w-14 rounded-pill bg-zebra" />
        ))}
      </div>
      <div className="h-24 w-full bg-zebra rounded-card mb-4" />
      <div className="h-10 w-40 bg-zebra rounded-pill" />
    </div>
  );
}

function MobileMetricBar({
  metrics,
  ratings,
  activeMetricId,
  projectSlug,
}: {
  metrics: import("../lib/types").MetricDef[];
  ratings: import("../lib/types").Rating[];
  activeMetricId: string;
  projectSlug: string;
}) {
  const scoredIds = new Set(ratings.filter((r) => r.metricId !== "final").map((r) => r.metricId));
  return (
    <nav className="lg:hidden no-print -mx-4 mb-4 px-4 py-2 border-b border-hairline bg-cream/95 backdrop-blur sticky top-[120px] z-10 overflow-x-auto">
      <ul className="flex gap-1.5 min-w-max">
        {metrics.map((m) => {
          const active = m.id === activeMetricId;
          const scored = scoredIds.has(m.id);
          return (
            <li key={m.id}>
              <Link
                to={`/project/${projectSlug}?m=${m.id}`}
                title={m.nameEn}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-pill text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral",
                  active
                    ? "bg-ink text-cream"
                    : scored
                      ? "bg-greenDark text-white"
                      : "bg-zebra text-muted hover:bg-hairline",
                )}
              >
                {m.letter}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function MetricEditor({
  metric,
  aiMetric,
  aiNotEvaluated,
  aiAnalysisPdf,
  existingScore,
  existingComment,
  onChange,
  onSaveAndReveal,
  onNext,
  onSeeResult,
  isLast,
  allDoneInProject,
}: {
  metric: import("../lib/types").MetricDef;
  aiMetric: import("../lib/types").AiMetricEval | null;
  aiNotEvaluated: boolean;
  aiAnalysisPdf: string | null;
  existingScore: number | null;
  existingComment: string;
  onChange: (score: number, comment: string) => void;
  onSaveAndReveal: (score: number, comment: string) => void;
  onNext: () => void;
  onSeeResult: () => void;
  isLast: boolean;
  allDoneInProject: boolean;
}) {
  const [score, setScore] = useState<number | null>(existingScore);
  const [comment, setComment] = useState<string>(existingComment);
  const [revealed, setRevealed] = useState<boolean>(existingScore !== null);
  const [typing, setTyping] = useState<boolean>(false);
  const aiRevealRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setScore(existingScore);
    setComment(existingComment);
    setRevealed(existingScore !== null);
  }, [metric.id, existingScore, existingComment]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [metric.id]);

  useEffect(() => {
    if (revealed) {
      aiRevealRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [revealed]);

  const handleScore = useCallback((v: number) => {
    setScore(v);
    onChange(v, comment);
    // a score change re-triggers the reveal (user can keep editing)
    if (!revealed) setRevealed(false);
  }, [comment, onChange, revealed]);

  const handleComment = useCallback((v: string) => {
    setComment(v);
    if (score !== null) onChange(score, v);
  }, [onChange, score]);

  const handleSave = useCallback(() => {
    if (score === null) return;
    onSaveAndReveal(score, comment);
    setRevealed(true);
  }, [score, comment, onSaveAndReveal]);

  // keyboard hotkeys
  const nextBtnRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const isTyping = tag === "TEXTAREA" || tag === "INPUT";

      if (!isTyping && /^[0-5]$/.test(e.key)) {
        e.preventDefault();
        handleScore(Number(e.key));
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (!isTyping && e.key === "ArrowRight" && revealed) {
        e.preventDefault();
        onNext();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handleScore, handleSave, onNext, revealed]);

  const saveDisabled = score === null;
  const savedWithCurrent = revealed && score === existingScore && comment === existingComment;

  return (
    <>
      <MetricHeader metric={metric} />

      <p className="text-[17px] leading-relaxed text-ink/85 mb-8 max-w-[640px]">
        {metric.what}
      </p>

      <Toggle title="How to evaluate" defaultOpen={false}>
        <HowBlock metric={metric} />
      </Toggle>

      <section className="mt-10 mb-6">
        <h3 className="text-sm font-bold text-ink mb-4">
          Your score for this metric
        </h3>
        <ScoreScale value={score} onChange={handleScore} rubric={metric.vectorRubric} />
      </section>

      <section className="mb-8">
        <label className="block text-xs uppercase tracking-wider text-muted mb-1" htmlFor="comment">
          Comment <span className="normal-case text-muted/70">(optional)</span>
        </label>
        <textarea
          id="comment"
          className="underline-input"
          placeholder="What is strong, what is weak…"
          rows={3}
          value={comment}
          onChange={(e) => handleComment(e.target.value)}
          onFocus={() => setTyping(true)}
          onBlur={() => setTyping(false)}
        />
      </section>

      <section className="mb-8 flex items-center gap-3 flex-wrap">
        <button
          type="button"
          disabled={saveDisabled}
          onClick={handleSave}
          className={
            "px-6 py-3 rounded-pill font-medium transition " +
            (saveDisabled
              ? "bg-hairline text-muted cursor-not-allowed"
              : savedWithCurrent
                ? "bg-transparent text-greenDark border-2 border-greenDark"
                : "bg-ink text-cream hover:bg-coral")
          }
        >
          {savedWithCurrent ? "✓ Saved" : "Save my rating"}
        </button>
        <span className={cn("text-xs text-muted transition-opacity", typing && "opacity-30")}>
          <kbd className="font-mono bg-zebra px-1.5 py-0.5 rounded">0</kbd>…
          <kbd className="font-mono bg-zebra px-1.5 py-0.5 rounded">5</kbd> select · {" "}
          <kbd className="font-mono bg-zebra px-1.5 py-0.5 rounded">⌘↵</kbd> save · {" "}
          <kbd className="font-mono bg-zebra px-1.5 py-0.5 rounded">→</kbd> next
        </span>
      </section>

      <div ref={aiRevealRef}>
        <AiReveal
          visible={revealed && score !== null}
          ai={aiMetric}
          notEvaluated={aiNotEvaluated}
          aiAnalysisPdf={aiAnalysisPdf}
        />
      </div>

      {revealed && score !== null && (
        <div className="mt-8 flex items-center gap-3 flex-wrap">
          {/* When the whole project is done, the primary CTA is always "See result" — momentum to next project. */}
          {allDoneInProject ? (
            <>
              <button
                ref={nextBtnRef}
                type="button"
                onClick={onSeeResult}
                className="px-6 py-3 rounded-pill bg-ink text-cream font-medium hover:bg-coral transition-colors"
              >
                ✓ Project done · see result →
              </button>
              {!isLast && (
                <button
                  type="button"
                  onClick={onNext}
                  className="text-sm text-muted hover:text-ink transition-colors"
                >
                  Next metric →
                </button>
              )}
            </>
          ) : (
            <button
              ref={nextBtnRef}
              type="button"
              onClick={onNext}
              className="px-6 py-3 rounded-pill bg-ink text-cream font-medium hover:bg-coral transition-colors"
            >
              {isLast ? "Finish · see result →" : "Next metric →"}
            </button>
          )}
        </div>
      )}
    </>
  );
}
