import type { Rating } from "./types";

const EXPERT_KEY = "hosq.expert";

export interface ExpertIdentity {
  id: string;
  name: string;
  createdAt: number;
}

export function readExpert(): ExpertIdentity | null {
  try {
    const raw = localStorage.getItem(EXPERT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v?.id || !v?.name) return null;
    return v as ExpertIdentity;
  } catch {
    return null;
  }
}

export function writeExpert(e: ExpertIdentity): void {
  localStorage.setItem(EXPERT_KEY, JSON.stringify(e));
}

export function clearExpert(): void {
  localStorage.removeItem(EXPERT_KEY);
}

export function slugify(s: string): string {
  const out = s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}\-]+/gu, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return out || "expert";
}

type RatingMap = Record<string, Rating>;

function ratingsKey(expertId: string): string {
  return `hosq.ratings.${expertId}`;
}

function readLocalMap(expertId: string): RatingMap {
  try {
    const raw = localStorage.getItem(ratingsKey(expertId));
    if (!raw) return {};
    return JSON.parse(raw) as RatingMap;
  } catch {
    return {};
  }
}

function writeLocalMap(expertId: string, map: RatingMap): void {
  localStorage.setItem(ratingsKey(expertId), JSON.stringify(map));
}

export function readLocalRatings(expertId: string): Rating[] {
  return Object.values(readLocalMap(expertId));
}

export function writeLocalRating(r: Rating): void {
  const map = readLocalMap(r.expertId);
  map[`${r.projectId}:${r.metricId}`] = r;
  writeLocalMap(r.expertId, map);
}

export function writeLocalRatingsBulk(expertId: string, ratings: Rating[]): void {
  const map = readLocalMap(expertId);
  for (const r of ratings) {
    const k = `${r.projectId}:${r.metricId}`;
    const existing = map[k];
    if (!existing || r.updatedAt >= existing.updatedAt) map[k] = r;
  }
  writeLocalMap(expertId, map);
}

export function mergeRatings(local: Rating[], server: Rating[]): Rating[] {
  const m = new Map<string, Rating>();
  for (const r of server) m.set(`${r.projectId}:${r.metricId}`, r);
  for (const r of local) {
    const k = `${r.projectId}:${r.metricId}`;
    const existing = m.get(k);
    if (!existing || r.updatedAt > existing.updatedAt) m.set(k, r);
  }
  return Array.from(m.values());
}

export interface Vault {
  version: 1;
  expert: ExpertIdentity;
  ratings: Rating[];
  exportedAt: number;
}

export function buildVault(expert: ExpertIdentity): Vault {
  return {
    version: 1,
    expert,
    ratings: readLocalRatings(expert.id),
    exportedAt: Date.now(),
  };
}

export function installVault(v: unknown): ExpertIdentity {
  if (!v || typeof v !== "object") throw new Error("Not a vault file.");
  const vault = v as Partial<Vault>;
  if (vault.version !== 1) throw new Error("Unsupported vault version.");
  if (!vault.expert?.id || !vault.expert?.name) throw new Error("Vault missing expert.");
  if (!Array.isArray(vault.ratings)) throw new Error("Vault missing ratings.");
  writeExpert(vault.expert);
  const map: RatingMap = readLocalMap(vault.expert.id);
  for (const r of vault.ratings as Rating[]) {
    const k = `${r.projectId}:${r.metricId}`;
    const existing = map[k];
    if (!existing || r.updatedAt > existing.updatedAt) map[k] = r;
  }
  writeLocalMap(vault.expert.id, map);
  return vault.expert;
}
