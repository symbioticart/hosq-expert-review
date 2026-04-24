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
      <div className="flex flex-wrap gap-2">
        {LEVELS.map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-pressed={active}
              className={cn(
                "h-14 w-14 rounded-pill font-bold text-xl transition border-2",
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

      <div className="mt-4 rounded-card border border-hairline bg-white/60 divide-y divide-hairline">
        <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-muted font-medium">
          How to pick a score (0–5)
        </div>
        {LEVELS.map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-pressed={active}
              className={cn(
                "w-full flex items-start gap-3 text-left px-4 py-2.5 transition",
                active ? "bg-coral/10" : "hover:bg-zebra/60",
              )}
            >
              <span
                className={cn(
                  "shrink-0 flex items-center justify-center h-6 w-6 rounded-pill text-xs font-bold",
                  active ? "bg-coral text-white" : "bg-ink text-cream",
                )}
              >
                {n}
              </span>
              <span className={cn("text-sm leading-snug", active ? "text-ink" : "text-ink/80")}>
                {rubric[String(n) as "0"]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
