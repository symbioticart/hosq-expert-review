import type { RubricLevels } from "../lib/types";
import { cn } from "../lib/util";

interface Props {
  value: number | null;
  onChange: (v: number) => void;
  rubric: RubricLevels;
}

const LEVELS = [0, 1, 2, 3, 4, 5] as const;

export function ScoreScale({ value, onChange, rubric }: Props) {
  const selected = value != null ? rubric[String(value) as "0"] : null;
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
      {selected && (
        <div className="mt-3 text-sm text-ink/80 leading-relaxed">
          <strong className="text-ink mr-2">{value}</strong>
          {selected}
        </div>
      )}
    </div>
  );
}
