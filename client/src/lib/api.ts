import type {
  AiEvaluation,
  Manifest,
  MetricsFile,
  ProjectMeta,
  ProjectSummaryResponse,
  Rating,
} from "./types";

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json() as Promise<T>;
}

async function putJson<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json() as Promise<T>;
}

// static files (served from /data)
export const loadManifest  = ()                  => getJson<Manifest>("/data/manifest.json");
export const loadMetrics   = ()                  => getJson<MetricsFile>("/data/metrics.json");
export const loadMeta      = (id: string)        => getJson<ProjectMeta>(`/data/${id}/meta.json`);
export const loadAiEval    = (id: string)        => getJson<AiEvaluation>(`/data/${id}/ai-evaluation.json`);

// API
export const fetchRatings           = (expertId: string) =>
  getJson<{ ratings: Rating[] }>(`/api/ratings?expertId=${encodeURIComponent(expertId)}`);

export const fetchProjectRatings    = (expertId: string, projectId: string) =>
  getJson<{ ratings: Rating[] }>(`/api/ratings/${projectId}?expertId=${encodeURIComponent(expertId)}`);

export const saveRating             = (args: {
  expertId: string;
  projectId: string;
  metricId: string;
  score: number;
  comment?: string | null;
}) => putJson<{ rating: Rating }>("/api/ratings", args);

export const fetchSummary           = (expertId: string, projectId: string) =>
  getJson<ProjectSummaryResponse>(
    `/api/summary/${projectId}?expertId=${encodeURIComponent(expertId)}`,
  );

export async function submitFeedback(body: {
  expertId?: string | null;
  expertName?: string | null;
  kind: "bug" | "feature" | "idea";
  message: string;
  route?: string | null;
  projectId?: string | null;
  metricId?: string | null;
  appVersion?: string | null;
}): Promise<{ feedback: { id: number; createdAt: number } }> {
  const r = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status} /api/feedback`);
  return r.json();
}
