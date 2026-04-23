import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Header } from "../components/Layout";
import { ReportView } from "../components/ReportView";
import { useExpertId } from "../hooks/useExpertId";
import { useProjectsAndMetrics } from "../hooks/useProjects";
import { fetchSummary } from "../lib/api";
import type { ProjectSummaryResponse } from "../lib/types";

export default function Final() {
  const { slug = "" } = useParams();
  const [expertId] = useExpertId();
  const { manifest, metrics, loading } = useProjectsAndMetrics();
  const [summary, setSummary] = useState<ProjectSummaryResponse | null>(null);

  const project = manifest?.projects.find((p) => p.slug === slug);

  useEffect(() => {
    if (!project) return;
    fetchSummary(expertId, project.id).then(setSummary).catch(console.error);
  }, [project, expertId]);

  const reportDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  if (loading || !manifest || !metrics) {
    return <div className="p-8 text-muted">Loading…</div>;
  }
  if (!project) {
    return (
      <div className="p-8">
        <Link to="/" className="text-coral hover:underline">← All projects</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream print:bg-white">
      <div className="no-print"><Header /></div>

      <main className="max-w-[1200px] mx-auto px-10 py-12 print:px-0 print:py-0 print:max-w-none">
        <Link to={`/project/${project.slug}`} className="no-print text-xs text-muted hover:text-ink transition">
          ← Back to review
        </Link>

        <ReportView
          project={project}
          summary={summary}
          expertId={expertId}
          reportDate={reportDate}
        />

        <div className="mt-12 no-print flex gap-3 flex-wrap">
          <Link
            to={`/project/${project.slug}`}
            className="px-6 py-3 rounded-pill bg-white border border-hairline text-ink hover:border-coral transition text-sm font-medium"
          >
            ← Back to review
          </Link>
          <Link
            to="/"
            className="px-6 py-3 rounded-pill bg-white border border-hairline text-ink hover:border-coral transition text-sm font-medium"
          >
            All projects
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-6 py-3 rounded-pill bg-ink text-cream hover:bg-coral transition text-sm font-medium"
          >
            Export PDF
          </button>
        </div>
      </main>
    </div>
  );
}
