import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.DB_PATH || "./dev.db";

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS ratings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    expert_id   TEXT    NOT NULL,
    project_id  TEXT    NOT NULL,
    metric_id   TEXT    NOT NULL,
    score       REAL    NOT NULL,
    comment     TEXT,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL,
    UNIQUE(expert_id, project_id, metric_id)
  );
  CREATE INDEX IF NOT EXISTS idx_exp_proj ON ratings(expert_id, project_id);

  CREATE TABLE IF NOT EXISTS experts (
    expert_id   TEXT    PRIMARY KEY,
    first_seen  INTEGER NOT NULL,
    last_seen   INTEGER NOT NULL
  );
`);

export interface RatingRow {
  id: number;
  expert_id: string;
  project_id: string;
  metric_id: string;
  score: number;
  comment: string | null;
  created_at: number;
  updated_at: number;
}

export function touchExpert(expertId: string) {
  const now = Date.now();
  db.prepare(`
    INSERT INTO experts (expert_id, first_seen, last_seen) VALUES (?, ?, ?)
    ON CONFLICT(expert_id) DO UPDATE SET last_seen = excluded.last_seen
  `).run(expertId, now, now);
}

export function upsertRating(args: {
  expertId: string;
  projectId: string;
  metricId: string;
  score: number;
  comment?: string | null;
}): RatingRow {
  const now = Date.now();
  db.prepare(`
    INSERT INTO ratings (expert_id, project_id, metric_id, score, comment, created_at, updated_at)
    VALUES (@expertId, @projectId, @metricId, @score, @comment, @now, @now)
    ON CONFLICT(expert_id, project_id, metric_id) DO UPDATE SET
      score = excluded.score,
      comment = excluded.comment,
      updated_at = excluded.updated_at
  `).run({ ...args, comment: args.comment ?? null, now });
  touchExpert(args.expertId);
  return db.prepare(`
    SELECT * FROM ratings
    WHERE expert_id = ? AND project_id = ? AND metric_id = ?
  `).get(args.expertId, args.projectId, args.metricId) as RatingRow;
}

export function getRatingsByExpert(expertId: string): RatingRow[] {
  return db.prepare(`
    SELECT * FROM ratings WHERE expert_id = ?
  `).all(expertId) as RatingRow[];
}

export function getRatingsByProject(expertId: string, projectId: string): RatingRow[] {
  return db.prepare(`
    SELECT * FROM ratings WHERE expert_id = ? AND project_id = ?
  `).all(expertId, projectId) as RatingRow[];
}

export function deleteRating(expertId: string, projectId: string, metricId: string) {
  db.prepare(`
    DELETE FROM ratings WHERE expert_id = ? AND project_id = ? AND metric_id = ?
  `).run(expertId, projectId, metricId);
}
