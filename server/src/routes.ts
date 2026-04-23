import { Router, type Request, type Response } from "express";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  deleteRating,
  getRatingsByExpert,
  getRatingsByProject,
  upsertRating,
  type RatingRow,
} from "./db.js";

const DATA_DIR = resolve(process.cwd(), "data");

function readJson<T = unknown>(rel: string): T {
  return JSON.parse(readFileSync(resolve(DATA_DIR, rel), "utf8")) as T;
}

interface MetricDef {
  id: string;
  letter: string;
  weight: number;
  nameEn: string;
  what: string;
  how: string;
  scale: { score: number; label: string }[];
  subindices: { id: string; name: string; description?: string }[];
}

interface AiEval {
  projectId: string;
  status: "evaluated" | "not_evaluated";
  summary?: string;
  finalScore?: number;
  finalScoreMax?: number;
  metrics?: {
    metricId: string;
    score: number;
    scoreMax: number;
    pros: string[];
    cons: string[];
  }[];
}

function requireExpertId(req: Request, res: Response): string | null {
  const id = (req.query.expertId as string) || (req.body?.expertId as string);
  if (!id || typeof id !== "string" || id.length < 4) {
    res.status(400).json({ error: "expertId required" });
    return null;
  }
  return id;
}

function serialiseRating(r: RatingRow) {
  return {
    expertId: r.expert_id,
    projectId: r.project_id,
    metricId: r.metric_id,
    score: r.score,
    comment: r.comment,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const api = Router();

api.get("/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

api.get("/ratings", (req, res) => {
  const expertId = requireExpertId(req, res);
  if (!expertId) return;
  res.json({ ratings: getRatingsByExpert(expertId).map(serialiseRating) });
});

api.get("/ratings/:projectId", (req, res) => {
  const expertId = requireExpertId(req, res);
  if (!expertId) return;
  res.json({
    ratings: getRatingsByProject(expertId, req.params.projectId).map(serialiseRating),
  });
});

api.put("/ratings", (req, res) => {
  const { expertId, projectId, metricId, score, comment } = req.body || {};
  if (!expertId || !projectId || !metricId || typeof score !== "number") {
    return res.status(400).json({ error: "expertId, projectId, metricId, score are required" });
  }
  if (score < 0 || score > 5) {
    return res.status(400).json({ error: "score must be 0..5" });
  }
  const row = upsertRating({ expertId, projectId, metricId, score, comment });
  res.json({ rating: serialiseRating(row) });
});

api.delete("/ratings", (req, res) => {
  const { expertId, projectId, metricId } = req.body || {};
  if (!expertId || !projectId || !metricId) {
    return res.status(400).json({ error: "expertId, projectId, metricId required" });
  }
  deleteRating(expertId, projectId, metricId);
  res.json({ ok: true });
});

api.get("/summary/:projectId", (req, res) => {
  const expertId = requireExpertId(req, res);
  if (!expertId) return;

  const metrics = readJson<{ metrics: MetricDef[] }>("metrics.json").metrics;

  let ai: AiEval;
  try {
    ai = readJson<AiEval>(`${req.params.projectId}/ai-evaluation.json`);
  } catch {
    return res.status(404).json({ error: "project not found" });
  }

  const expertRatings = new Map<string, RatingRow>();
  for (const r of getRatingsByProject(expertId, req.params.projectId)) {
    expertRatings.set(r.metric_id, r);
  }

  const byMetric = metrics.map((m) => {
    const er = expertRatings.get(m.id);
    const ae = ai.status === "evaluated"
      ? ai.metrics?.find((x) => x.metricId === m.id)
      : undefined;
    return {
      metricId: m.id,
      letter: m.letter,
      nameEn: m.nameEn,
      weight: m.weight,
      expertScore: er ? er.score : null,
      expertComment: er ? er.comment : null,
      aiScore: ae ? ae.score : null,
      aiPros: ae ? ae.pros : [],
      aiCons: ae ? ae.cons : [],
    };
  });

  const weightedExpert = byMetric
    .filter((r) => r.expertScore !== null)
    .reduce((sum, r) => sum + (r.expertScore as number) * r.weight, 0);
  const weightSumDone = byMetric
    .filter((r) => r.expertScore !== null)
    .reduce((sum, r) => sum + r.weight, 0);

  const expertFinal = weightSumDone > 0 ? weightedExpert / weightSumDone : null;
  const expertProgress = byMetric.filter((r) => r.expertScore !== null).length;

  res.json({
    projectId: req.params.projectId,
    expertFinal,
    expertProgress,
    totalMetrics: metrics.length,
    aiFinal: ai.status === "evaluated" ? ai.finalScore ?? null : null,
    aiFinalMax: ai.status === "evaluated" ? ai.finalScoreMax ?? 100 : null,
    aiStatus: ai.status,
    aiSummary: ai.summary ?? null,
    byMetric,
  });
});
