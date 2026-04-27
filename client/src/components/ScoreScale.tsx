import type { RubricLevels } from "../lib/types";
import { cn } from "../lib/util";

interface Props {
  value: number | null;
  onChange: (v: number) => void;
  rubric: RubricLevels;
}

const LEVELS = [0, 1, 2, 3, 4, 5] as const;

export function ScoreScale({ value, onChange, rubric }: Props) {
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Score from 0 to 5">
        {LEVELS.map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              role="radio"
              aria-checked={active}
              aria-label={`Score ${n} of 5`}
              className={cn(
                "h-12 w-12 sm:h-14 sm:w-14 rounded-pill font-bold text-lg sm:text-xl transition-colors border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
                active
                  ? "bg-coral text-white border-coral"
                  : "bg-transparent text-ink border-ink/20 hover:border-ink",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        <div className="text-[10px] uppercase tracking-wider text-muted/80 font-medium mb-2">
          How to pick a score (0–5)
        </div>
        <ul className="space-y-1">
          {LEVELS.map((n) => {
            const active = value === n;
            return (
              <li key={n}>
                <button
                  type="button"
                  onClick={() => onChange(n)}
                  aria-pressed={active}
                  className={cn(
                    "w-full flex items-start gap-3 text-left py-0.5 rounded-sm transition hover:text-ink",
                    active ? "text-ink" : "text-muted",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 font-mono text-[11px] font-bold w-4 text-right pt-[2px]",
                      active ? "text-ink" : "text-muted/70",
                    )}
                  >
                    {n}
                  </span>
                  <span className={cn("text-[13px] leading-snug", active && "font-medium")}>
                    {rubric[String(n) as "0"]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
