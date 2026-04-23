import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Header } from "../components/Layout";
import { ReportView } from "../components/ReportView";
import { useExpertId } from "../hooks/useExpertId";
import { useProjectsAndMetrics } from "../hooks/useProjects";
import { fetchSummary } from "../lib/api";
import type { ProjectSummary, ProjectSummaryResponse } from "../lib/types";

type Loaded = { project: ProjectSummary; summary: ProjectSummaryResponse };

export default function AllReports() {
  const navigate = useNavigate();
  const [expertId] = useExpertId();
  const { manifest, metrics, loading } = useProjectsAndMetrics();
  const [reports, setReports] = useState<Loaded[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [printed, setPrinted] = useState(false);

  const reportDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  useEffect(() => {
    if (!manifest || !expertId) return;
    (async () => {
      try {
        const results = await Promise.all(
          manifest.projects.map(async (p) => {
            const summary = await fetchSummary(expertId, p.id);
            return { project: p, summary };
          }),
        );
        setReports(results);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load reports.");
      }
    })();
  }, [manifest, expertId]);

  useEffect(() => {
    if (!reports || printed) return;
    const t = window.setTimeout(() => {
      setPrinted(true);
      window.print();
    }, 400);
    return () => window.clearTimeout(t);
  }, [reports, printed]);

  if (loading || !manifest || !metrics) {
    return <div className="p-8 text-muted">Loading…</div>;
  }
  if (err) {
    return (
      <div className="p-8">
        <p className="text-coral mb-4">Could not prepare reports: {err}</p>
        <Link to="/" className="text-coral hover:underline">← All projects</Link>
      </div>
    );
  }
  if (!reports) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 rounded-pill border-2 border-coral border-t-transparent animate-spin" />
        <div className="text-ink text-sm">Preparing {manifest.projects.length} reports…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream print:bg-white">
      <div className="no-print"><Header /></div>

      <main className="max-w-[1200px] mx-auto px-10 py-12 print:px-0 print:py-0 print:max-w-none">
        <div className="no-print flex items-center justify-between mb-8 flex-wrap gap-3">
          <Link to="/" className="text-xs text-muted hover:text-ink transition">← All projects</Link>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-muted">
              {reports.length} reports · Expert {expertId || "—"}
            </span>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-4 py-2 rounded-pill bg-white border border-hairline text-ink hover:border-coral transition text-sm"
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-2 rounded-pill bg-ink text-cream hover:bg-coral transition text-sm font-medium"
            >
              Open print dialog
            </button>
          </div>
        </div>

        {reports.map((r, i) => (
          <ReportView
            key={r.project.id}
            project={r.project}
            summary={r.summary}
            expertId={expertId}
            reportDate={reportDate}
            firstOnPage={i === 0}
          />
        ))}
      </main>
    </div>
  );
}
