import type { AiMetricEval } from "../lib/types";

interface Props {
  visible: boolean;
  ai: AiMetricEval | null;
  notEvaluated?: boolean;
  aiAnalysisPdf?: string | null;
}

export function AiReveal({ visible, ai, notEvaluated, aiAnalysisPdf }: Props) {
  if (!visible) return null;

  if (notEvaluated || !ai) {
    return (
      <div className="mt-6 rounded-card bg-blush p-6">
        <div className="text-xs uppercase tracking-wider text-muted mb-1">AI evaluation</div>
        <p className="text-sm text-ink/80">
          AI analysis is not available for this project.
        </p>
      </div>
    );
  }

  const normalised = (ai.score / ai.scoreMax) * 5;
  const scorePct = (ai.score / ai.scoreMax) * 100;

  return (
    <div className="mt-6 rounded-card bg-blush p-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted mb-1">AI evaluation</div>
          <div className="text-sm text-muted">The LLM judge's take on this metric</div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-violet leading-none">
            {ai.score}
            <span className="text-base text-muted font-normal">/{ai.scoreMax}</span>
          </div>
          <div className="mt-2 h-1 w-24 bg-hairline rounded-full overflow-hidden">
            <div className="h-full bg-violet" style={{ width: `${scorePct}%` }} />
          </div>
          <div className="mt-1 text-[10px] text-muted">
            ≈ {normalised.toFixed(1)}/5
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <h4 className="text-[11px] uppercase tracking-wider text-green font-bold mb-2">
            Strengths
          </h4>
          <ul className="space-y-1.5">
            {ai.pros.length === 0 ? (
              <li className="text-sm text-muted italic">— none recorded —</li>
            ) : (
              ai.pros.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-green shrink-0 mt-1">●</span>
                  <span className="text-ink/90">{p}</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] uppercase tracking-wider text-coral font-bold mb-2">
            Weaknesses
          </h4>
          <ul className="space-y-1.5">
            {ai.cons.length === 0 ? (
              <li className="text-sm text-muted italic">— none recorded —</li>
            ) : (
              ai.cons.map((c, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-coral shrink-0 mt-1">●</span>
                  <span className="text-ink/90">{c}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {aiAnalysisPdf && (
        <div className="mt-5 pt-4 border-t border-hairline">
          <a
            href={aiAnalysisPdf}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted hover:text-coral transition"
          >
            Open full AI analysis PDF →
          </a>
        </div>
      )}
    </div>
  );
}
