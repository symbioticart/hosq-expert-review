import { useEffect, useRef, useState } from "react";
import type { AiEvaluation, ProjectMeta } from "../lib/types";
import { cn, mdToBlocks } from "../lib/util";

type Tab = "description" | "data" | "pdf" | "ai";

const CTX_WIDTH_KEY = "hosq.ctxWidth";
const CTX_WIDTH_MIN = 320;
const CTX_WIDTH_MAX_DESKTOP = 720;
const CTX_WIDTH_DEFAULT = 380;

function maxWidthForViewport(): number {
  if (typeof window === "undefined") return CTX_WIDTH_MAX_DESKTOP;
  // Cap context panel at ~half the viewport so it never crowds out the metric editor.
  return Math.min(CTX_WIDTH_MAX_DESKTOP, Math.max(CTX_WIDTH_MIN, Math.floor(window.innerWidth * 0.5)));
}

function clampWidth(n: number): number {
  return Math.min(maxWidthForViewport(), Math.max(CTX_WIDTH_MIN, n));
}

function readStoredWidth(): number {
  try {
    const raw = localStorage.getItem(CTX_WIDTH_KEY);
    const n = raw ? parseInt(raw, 10) : NaN;
    if (Number.isFinite(n)) return clampWidth(n);
  } catch { /* ignore */ }
  return clampWidth(CTX_WIDTH_DEFAULT);
}

interface AsideProps {
  meta: ProjectMeta;
  ai: AiEvaluation;
  className?: string;
}

export function ProjectContext({ meta, ai, className }: AsideProps) {
  const [tab, setTab] = useState<Tab>("description");
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState<number>(() => readStoredWidth());
  const dragStartRef = useRef<{ x: number; w: number } | null>(null);

  const aiAvailable = ai.status === "evaluated" && !!meta.aiAnalysisPdf;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragStartRef.current;
      if (!d) return;
      setWidth(clampWidth(d.w + (d.x - e.clientX)));
    };
    const onUp = () => {
      if (!dragStartRef.current) return;
      dragStartRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      try { localStorage.setItem(CTX_WIDTH_KEY, String(Math.round(width))); } catch { /* ignore */ }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    // re-clamp on window resize so the panel can't overflow on smaller viewports
    const onResize = () => setWidth((w) => clampWidth(w));
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", onResize);
    };
  }, [width]);

  const startDrag = (e: React.PointerEvent) => {
    dragStartRef.current = { x: e.clientX, w: width };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const onResizeKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const STEP = e.shiftKey ? 32 : 8;
    if (e.key === "ArrowLeft") { e.preventDefault(); setWidth((w) => clampWidth(w + STEP)); }
    if (e.key === "ArrowRight") { e.preventDefault(); setWidth((w) => clampWidth(w - STEP)); }
    if (e.key === "Home") { e.preventDefault(); setWidth(clampWidth(CTX_WIDTH_DEFAULT)); }
  };

  if (collapsed) {
    return (
      <aside className={cn("no-print sticky top-[72px] h-[calc(100vh-72px)] w-12 shrink-0 border-l border-hairline bg-white flex flex-col items-center py-4 gap-4", className)}>
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Expand project context"
          className="text-muted hover:text-ink transition text-lg"
          title="Expand project context"
        >
          ◀
        </button>
        <div className="rotate-90 origin-center text-[10px] uppercase tracking-[0.2em] text-muted whitespace-nowrap mt-12">
          Project context
        </div>
      </aside>
    );
  }

  return (
    <aside
      style={{ width }}
      className={cn("no-print sticky top-[72px] h-[calc(100vh-72px)] shrink-0 border-l border-hairline bg-white flex-col relative", className ?? "flex")}
    >
      <div
        role="slider"
        tabIndex={0}
        aria-label="Resize project context panel"
        aria-valuemin={CTX_WIDTH_MIN}
        aria-valuemax={maxWidthForViewport()}
        aria-valuenow={Math.round(width)}
        aria-orientation="vertical"
        onPointerDown={startDrag}
        onKeyDown={onResizeKey}
        onDoubleClick={() => { setWidth(clampWidth(CTX_WIDTH_DEFAULT)); try { localStorage.setItem(CTX_WIDTH_KEY, String(CTX_WIDTH_DEFAULT)); } catch { /* ignore */ } }}
        title="Drag, ←/→ to resize, double-click to reset"
        className="absolute left-0 top-0 h-full w-1.5 -ml-[3px] cursor-col-resize group z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
      >
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-transparent group-hover:bg-coral group-focus-visible:bg-coral transition-colors" />
      </div>
      <TabBar tab={tab} setTab={setTab} aiAvailable={aiAvailable} trailingSlot={
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          aria-label="Collapse"
          className="text-muted hover:text-ink transition text-lg ml-2"
          title="Collapse panel"
        >
          ▶
        </button>
      } />
      <TabContent tab={tab} meta={meta} aiAvailable={aiAvailable} />
    </aside>
  );
}

export function ProjectContextDrawer({
  meta,
  ai,
  open,
  onClose,
  className,
}: AsideProps & { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("description");
  const aiAvailable = ai.status === "evaluated" && !!meta.aiAnalysisPdf;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      className={cn("no-print fixed inset-0 z-40 transition-opacity", className, open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <aside
        className={cn(
          "absolute top-0 right-0 h-full w-full max-w-[480px] bg-white flex flex-col shadow-xl transition-transform",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <TabBar tab={tab} setTab={setTab} aiAvailable={aiAvailable} trailingSlot={
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-ink transition text-lg ml-2 px-2"
            title="Close"
          >
            ✕
          </button>
        } />
        <TabContent tab={tab} meta={meta} aiAvailable={aiAvailable} />
      </aside>
    </div>
  );
}

function TabBar({
  tab,
  setTab,
  aiAvailable,
  trailingSlot,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  aiAvailable: boolean;
  trailingSlot?: React.ReactNode;
}) {
  const btn = (k: Tab, label: string, disabled = false) => (
    <button
      key={k}
      type="button"
      disabled={disabled}
      onClick={() => setTab(k)}
      className={cn(
        "px-3 py-2 text-xs font-medium rounded-pill transition",
        tab === k   ? "bg-ink text-cream" :
        disabled    ? "text-muted/50 cursor-not-allowed" :
                      "text-muted hover:text-ink hover:bg-zebra",
      )}
      title={disabled ? "AI analysis not available for this project" : undefined}
    >
      {label}
    </button>
  );
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
      <div className="flex gap-1 flex-wrap">
        {btn("description", "Description")}
        {btn("data", "Data")}
        {btn("pdf", "PDF")}
        {btn("ai", "AI analysis", !aiAvailable)}
      </div>
      {trailingSlot}
    </div>
  );
}

function TabContent({
  tab,
  meta,
  aiAvailable,
}: {
  tab: Tab;
  meta: ProjectMeta;
  aiAvailable: boolean;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-5">
      {tab === "description" && <DescriptionView description={meta.description} />}
      {tab === "data" && <DataTableView columns={meta.tableColumns} rows={meta.tableRows} />}
      {tab === "pdf" && <PdfView src={meta.sourcePdf} />}
      {tab === "ai"  && aiAvailable && meta.aiAnalysisPdf && <PdfView src={meta.aiAnalysisPdf} />}
    </div>
  );
}

function DescriptionView({ description }: { description: string }) {
  const blocks = mdToBlocks(description);
  return (
    <div className="text-sm leading-relaxed">
      {blocks.map((b, i) =>
        b.kind === "h" ? (
          <h4 key={i} className="font-bold text-ink mt-5 first:mt-0 mb-2 text-[13px] uppercase tracking-wide">
            {b.text}
          </h4>
        ) : (
          <p key={i} className="text-ink/90 mb-3 whitespace-pre-wrap">{b.text}</p>
        ),
      )}
    </div>
  );
}

function DataTableView({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead className="sticky top-0 bg-white">
        <tr className="text-left">
          {columns.map((c, i) => (
            <th key={i} className="py-2 px-2 text-[10px] uppercase tracking-wider text-muted font-medium border-b border-hairline">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className={i % 2 === 0 ? "bg-zebra/50" : ""}>
            {row.map((cell, j) => (
              <td
                key={j}
                className={cn(
                  "py-2 px-2 align-top",
                  j === 0 ? "text-muted w-[42%]" : "text-ink",
                )}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PdfView({ src }: { src: string }) {
  return (
    <div className="h-full flex flex-col gap-2">
      <iframe
        src={`${src}#toolbar=0&navpanes=0&view=FitH`}
        title="PDF"
        className="w-full flex-1 min-h-[60vh] rounded-card border border-hairline bg-white"
      />
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-coral hover:underline self-start"
      >
        Open in new tab →
      </a>
    </div>
  );
}
