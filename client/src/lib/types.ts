export interface ProjectSummary {
  id: string;
  slug: string;
  name: string;
}

export interface Manifest {
  projects: ProjectSummary[];
}

export interface MetricScale {
  score: number;
  label: string;
}

export interface SubIndex {
  id: string;
  name: string;
  description?: string;
}

export interface MetricDef {
  id: string;
  letter: string;
  weight: number;
  nameEn: string;
  what: string;
  how: string;
  scale: MetricScale[];
  subindices: SubIndex[];
}

export interface MetricsFile {
  metrics: MetricDef[];
}

export interface ProjectMeta {
  id: string;
  name: string;
  description: string;
  tableColumns: string[];
  tableRows: string[][];
  sourcePdf: string;
  aiAnalysisPdf: string | null;
}

export interface AiMetricEval {
  metricId: string;
  score: number;
  scoreMax: number;
  pros: string[];
  cons: string[];
}

export interface AiEvaluation {
  projectId: string;
  status: "evaluated" | "not_evaluated";
  summary?: string;
  finalScore?: number;
  finalScoreMax?: number;
  metrics?: AiMetricEval[];
}

export interface Rating {
  expertId: string;
  projectId: string;
  metricId: string;
  score: number;
  comment: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface SummaryMetric {
  metricId: string;
  letter: string;
  nameEn: string;
  weight: number;
  expertScore: number | null;
  expertComment: string | null;
  aiScore: number | null;
  aiPros: string[];
  aiCons: string[];
}

export interface ProjectSummaryResponse {
  projectId: string;
  expertFinal: number | null;
  expertProgress: number;
  totalMetrics: number;
  aiFinal: number | null;
  aiFinalMax: number | null;
  aiStatus: "evaluated" | "not_evaluated";
  aiSummary: string | null;
  byMetric: SummaryMetric[];
}
