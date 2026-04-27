import { useState } from "react";
import type { MetricDef, SubIndex } from "../lib/types";
import { cn } from "../lib/util";

export function MetricHeader({ metric }: { metric: MetricDef }) {
  return (
    <div className="flex items-start gap-5 mb-6">
      <span className="shrink-0 flex items-center justify-center h-14 w-14 rounded-pill bg-coral text-white text-2xl font-bold">
        {metric.letter}
      </span>
      <div className="flex-1 min-w-0">
        <h1 className="font-bold text-[36px] leading-[1.1] text-ink">
          {metric.nameEn}
        </h1>
        <div className="mt-1 text-xs text-muted">
          weight <strong className="text-ink">{metric.weight.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
}

export function Toggle({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="mb-6 border-l-2 border-hairline pl-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[15px] font-bold text-ink hover:text-coral transition"
      >
        <span className={cn("inline-block transition-transform", open ? "rotate-90" : "rotate-0")}>
          ▸
        </span>
        {title}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </section>
  );
}

export function WhatBlock({ what }: { what: string }) {
  return <p className="text-[15px] leading-relaxed text-ink/90">{what}</p>;
}

const LEVEL_KEYS = ["0", "1", "2", "3", "4", "5"] as const;

export function HowBlock({ metric }: { metric: MetricDef }) {
  return (
    <div className="space-y-6 text-sm">
      {metric.scoringDiscipline && (
        <div className="rounded-card bg-blush/60 border border-coral/20 p-4">
          <h4 className="text-[10px] uppercase tracking-wider text-coral font-bold mb-2">
            Scoring discipline
          </h4>
          <div className="text-ink/90 leading-relaxed space-y-2">
            {metric.scoringDiscipline.split(/\n\n+/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      )}

      {metric.ceilingRules.length > 0 && (
        <div>
          <h4 className="text-[11px] uppercase tracking-wider text-muted font-medium mb-2">
            Ceiling rules
          </h4>
          <ul className="space-y-1 text-[13px] text-ink/80">
            {metric.ceilingRules.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-coral shrink-0">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {metric.subindices.length > 0 && (
        <SubindexDrawer subindices={metric.subindices} />
      )}
    </div>
  );
}

function SubindexDrawer({ subindices }: { subindices: SubIndex[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted font-medium hover:text-coral transition"
      >
        <span className={cn("inline-block transition-transform", open ? "rotate-90" : "rotate-0")}>
          ▸
        </span>
        Detailed sub-index rubrics ({subindices.length})
      </button>
      {open && (
        <div className="mt-3 space-y-5">
          {subindices.map((s) => (
            <div key={s.id} className="border-l-2 border-hairline pl-4 min-w-0">
              <div className="flex items-baseline gap-2 mb-2 flex-wrap">
                <span className="font-mono text-[11px] font-bold text-coral shrink-0">{s.id}</span>
                <span className="font-medium text-ink break-words">{s.name}</span>
              </div>
              {s.description && (
                <p className="text-[13px] text-muted mb-3 leading-snug break-words">{s.description}</p>
              )}
              <ol className="space-y-1.5">
                {LEVEL_KEYS.map((k) => (
                  <li key={k} className="flex gap-2.5 text-[13px] leading-snug">
                    <span className="shrink-0 w-5 h-5 rounded-pill bg-zebra text-ink text-[11px] font-bold flex items-center justify-center">
                      {k}
                    </span>
                    <span className="text-ink/80 break-words min-w-0">{s.rubric[k] || "—"}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
