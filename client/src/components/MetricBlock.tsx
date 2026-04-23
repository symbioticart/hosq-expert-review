import { useState } from "react";
import type { MetricDef } from "../lib/types";
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

export function HowBlock({ metric }: { metric: MetricDef }) {
  return (
    <div className="space-y-4 text-sm">
      <p className="text-ink/90 leading-relaxed">{metric.how}</p>

      <div>
        <h4 className="text-[11px] uppercase tracking-wider text-muted font-medium mb-2">
          Scoring scale
        </h4>
        <ol className="space-y-1">
          {metric.scale.map((s) => (
            <li key={s.score} className="flex gap-3 text-sm leading-tight">
              <span className="shrink-0 w-5 h-5 rounded-pill bg-zebra text-ink text-xs font-bold flex items-center justify-center">
                {s.score}
              </span>
              <span className="text-ink/80">{s.label}</span>
            </li>
          ))}
        </ol>
      </div>

      {metric.subindices.length > 0 && (
        <div>
          <h4 className="text-[11px] uppercase tracking-wider text-muted font-medium mb-2">
            Sub-indices (reference)
          </h4>
          <ul className="space-y-1.5">
            {metric.subindices.map((s) => (
              <li key={s.id} className="flex gap-2 text-sm leading-snug">
                <span className="font-mono font-bold text-muted shrink-0">{s.id}</span>
                <div>
                  <span className="font-medium text-ink">{s.name}</span>
                  {s.description && (
                    <span className="text-muted"> — {s.description}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
