import { useState } from "react";
import type { AiEvaluation, ProjectMeta } from "../lib/types";
import { cn, mdToBlocks } from "../lib/util";

type Tab = "description" | "data" | "pdf" | "ai";

interface Props {
  meta: ProjectMeta;
  ai: AiEvaluation;
}

export function ProjectContext({ meta, ai }: Props) {
  const [tab, setTab] = useState<Tab>("description");
  const [collapsed, setCollapsed] = useState(false);

  const aiAvailable = ai.status === "evaluated" && !!meta.aiAnalysisPdf;

  if (collapsed) {
    return (
      <aside className="no-print sticky top-[72px] h-[calc(100vh-72px)] w-12 shrink-0 border-l border-hairline bg-white flex flex-col items-center py-4 gap-4">
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

  const tabBtn = (k: Tab, label: string, disabled = false) => (
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
    <aside className="no-print sticky top-[72px] h-[calc(100vh-72px)] w-[380px] shrink-0 border-l border-hairline bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
        <div className="flex gap-1 flex-wrap">
          {tabBtn("description", "Description")}
          {tabBtn("data", "Data")}
          {tabBtn("pdf", "PDF")}
          {tabBtn("ai", "AI analysis", !aiAvailable)}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          aria-label="Collapse"
          className="text-muted hover:text-ink transition text-lg ml-2"
          title="Collapse panel"
        >
          ▶
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === "description" && <DescriptionView description={meta.description} />}
        {tab === "data" && <DataTableView columns={meta.tableColumns} rows={meta.tableRows} />}
        {tab === "pdf" && <PdfView src={meta.sourcePdf} />}
        {tab === "ai"  && aiAvailable && meta.aiAnalysisPdf && <PdfView src={meta.aiAnalysisPdf} />}
      </div>
    </aside>
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
