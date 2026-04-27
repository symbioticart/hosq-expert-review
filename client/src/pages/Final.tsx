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
  const [err, setErr] = useState<string | null>(null);

  const project = manifest?.projects.find((p) => p.slug === slug);

  useEffect(() => {
    if (!project) return;
    setErr(null);
    fetchSummary(expertId, project.id)
      .then(setSummary)
      .catch((e) => {
        setErr(e instanceof Error ? e.message : "Could not load summary.");
        // eslint-disable-next-line no-console
        console.error(e);
      });
  }, [project, expertId]);

  const noRatings = summary != null && (summary.expertProgress ?? 0) === 0;

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

        {err && (
          <div className="no-print mt-6 rounded-card border border-coral/40 bg-coral/5 p-4 text-sm text-coral">
            Couldn't load summary: {err}.{" "}
            <Link to={`/project/${project.slug}`} className="underline">Back to review</Link>
          </div>
        )}

        {!err && noRatings && (
          <div className="no-print mt-10 text-center bg-white rounded-card border border-hairline p-12">
            <div className="text-4xl mb-2">∅</div>
            <h2 className="text-h3 font-bold text-ink mb-2">No ratings yet for this project</h2>
            <p className="text-sm text-muted mb-6">
              Rate at least one of the 10 metrics to see your weighted score, AI comparison, and breakdown.
            </p>
            <Link
              to={`/project/${project.slug}`}
              className="inline-flex px-6 py-3 rounded-pill bg-ink text-cream text-sm font-medium hover:bg-coral transition-colors"
            >
              Start rating →
            </Link>
          </div>
        )}

        {!err && !noRatings && (
          <ReportView
            project={project}
            summary={summary}
            expertId={expertId}
            reportDate={reportDate}
          />
        )}

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
