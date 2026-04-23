import { useCallback, useEffect, useRef, useState } from "react";

import { fetchProjectRatings, fetchRatings, saveRating } from "../lib/api";
import {
  mergeRatings,
  readLocalRatings,
  writeLocalRating,
  writeLocalRatingsBulk,
} from "../lib/storage";
import type { Rating } from "../lib/types";

function pushIfNewer(local: Rating[], server: Rating[]): void {
  const serverIdx = new Map<string, Rating>();
  for (const r of server) serverIdx.set(`${r.projectId}:${r.metricId}`, r);
  for (const m of local) {
    const key = `${m.projectId}:${m.metricId}`;
    const s = serverIdx.get(key);
    if (!s || m.updatedAt > s.updatedAt) {
      saveRating({
        expertId: m.expertId,
        projectId: m.projectId,
        metricId: m.metricId,
        score: m.score,
        comment: m.comment,
      }).catch(() => {
        // server unreachable; local copy is the source of truth
      });
    }
  }
}

export function useAllRatings(expertId: string) {
  const [ratings, setRatings] = useState<Rating[]>(() => readLocalRatings(expertId));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    if (!expertId) return;
    setLoading(true);
    const local = readLocalRatings(expertId);
    setRatings(local);
    try {
      const r = await fetchRatings(expertId);
      const merged = mergeRatings(local, r.ratings);
      pushIfNewer(local, r.ratings);
      writeLocalRatingsBulk(expertId, merged);
      setRatings(merged);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [expertId]);

  useEffect(() => { reload(); }, [reload]);

  return { ratings, loading, error, reload };
}

export function useProjectRatings(expertId: string, projectId: string) {
  const [ratings, setRatings] = useState<Rating[]>(() =>
    readLocalRatings(expertId).filter((r) => r.projectId === projectId),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const inflight = useRef<{ [k: string]: number }>({});

  const reload = useCallback(async () => {
    if (!expertId || !projectId) return;
    setLoading(true);
    const local = readLocalRatings(expertId).filter((r) => r.projectId === projectId);
    setRatings(local);
    try {
      const r = await fetchProjectRatings(expertId, projectId);
      const merged = mergeRatings(local, r.ratings);
      pushIfNewer(local, r.ratings);
      writeLocalRatingsBulk(expertId, merged);
      setRatings(merged);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [expertId, projectId]);

  useEffect(() => { reload(); }, [reload]);

  const save = useCallback(
    async (metricId: string, score: number, comment: string | null) => {
      const now = Date.now();
      const optimistic: Rating = {
        expertId, projectId, metricId, score, comment,
        createdAt: now, updatedAt: now,
      };
      writeLocalRating(optimistic);
      const token = now;
      inflight.current[metricId] = token;
      setRatings((prev) => {
        const without = prev.filter((x) => x.metricId !== metricId);
        return [...without, optimistic];
      });
      try {
        const r = await saveRating({ expertId, projectId, metricId, score, comment });
        if (inflight.current[metricId] !== token) return;
        writeLocalRating(r.rating);
        setRatings((prev) => {
          const without = prev.filter((x) => x.metricId !== metricId);
          return [...without, r.rating];
        });
      } catch (e) {
        // local copy already saved; server will catch up on next successful call
        console.warn("server save failed, kept local", e);
      }
    },
    [expertId, projectId],
  );

  return { ratings, loading, error, reload, save };
}

export function useDebouncedSave(
  save: (metricId: string, score: number, comment: string | null) => Promise<void>,
  delayMs = 500,
) {
  const timers = useRef<{ [k: string]: ReturnType<typeof setTimeout> }>({});
  return useCallback(
    (metricId: string, score: number, comment: string | null) => {
      clearTimeout(timers.current[metricId]);
      timers.current[metricId] = setTimeout(() => {
        save(metricId, score, comment);
      }, delayMs);
    },
    [save, delayMs],
  );
}
