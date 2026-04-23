import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { MetricsFile, ProjectSummary, Rating } from "../lib/types";
import { cn } from "../lib/util";

interface Props {
  projects: ProjectSummary[];
  currentId: string;
  metrics: MetricsFile;
  allRatings: Rating[];
}

export function ProjectSwitcher({ projects, currentId, metrics, allRatings }: Props) {
  const [open, setOpen] = useState(false);
  const current = projects.find((p) => p.id === currentId);
  const total = metrics.metrics.length;
  const ref = useRef<HTMLDivElement | null>(null);

  const progressById = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of allRatings) {
      if (r.metricId === "final") continue;
      m[r.projectId] = (m[r.projectId] ?? 0) + 1;
    }
    return m;
  }, [allRatings]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-card border border-hairline hover:border-coral transition text-left"
      >
        <span className="flex-1 min-w-0">
          <span className="block text-[10px] uppercase tracking-wider text-muted">Project</span>
          <span className="block truncate text-sm font-medium text-ink">
            {current?.name ?? currentId}
          </span>
        </span>
        <span className="shrink-0 text-muted">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1 z-20 bg-white rounded-card border border-hairline overflow-hidden">
          {projects.map((p) => {
            const done = progressById[p.id] ?? 0;
            const isCur = p.id === currentId;
            return (
              <Link
                key={p.id}
                to={`/project/${p.slug}`}
                onClick={() => setOpen(false)}
                className={cn(
                  "block px-3 py-2.5 transition",
                  isCur ? "bg-blush" : "hover:bg-zebra",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-ink">{p.name}</span>
                  <span className="text-[10px] text-muted whitespace-nowrap">
                    {done === total ? "done" : `${done}/${total}`}
                  </span>
                </div>
                <div className="mt-1.5 flex gap-0.5">
                  {Array.from({ length: total }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full",
                        i < done ? "bg-coral" : "bg-blush",
                      )}
                    />
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
