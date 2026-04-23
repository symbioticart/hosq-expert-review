import type { MetricScale } from "../lib/types";
import { cn } from "../lib/util";

interface Props {
  value: number | null;
  onChange: (v: number) => void;
  scale: MetricScale[];
}

export function ScoreScale({ value, onChange, scale }: Props) {
  const selected = scale.find((s) => s.score === value);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {scale.map((s) => {
          const active = value === s.score;
          return (
            <button
              key={s.score}
              type="button"
              onClick={() => onChange(s.score)}
              aria-pressed={active}
              className={cn(
                "h-14 w-14 rounded-pill font-bold text-xl transition border-2",
                active
                  ? "bg-coral text-white border-coral"
                  : "bg-transparent text-ink border-ink/20 hover:border-ink",
              )}
            >
              {s.score}
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="mt-3 text-sm text-muted">
          <strong className="text-ink mr-2">{selected.score}</strong>
          {selected.label}
        </div>
      )}
    </div>
  );
}
