import { useCallback, useEffect, useRef, useState } from "react";
import { fetchProjectRatings, fetchRatings, saveRating } from "../lib/api";
import type { Rating } from "../lib/types";

export function useAllRatings(expertId: string) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchRatings(expertId);
      setRatings(r.ratings);
    } catch (e: unknown) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [expertId]);

  useEffect(() => { reload(); }, [reload]);

  return { ratings, loading, error, reload };
}

export function useProjectRatings(expertId: string, projectId: string) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const inflight = useRef<{ [k: string]: number }>({});

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchProjectRatings(expertId, projectId);
      setRatings(r.ratings);
    } catch (e: unknown) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [expertId, projectId]);

  useEffect(() => { reload(); }, [reload]);

  const save = useCallback(
    async (metricId: string, score: number, comment: string | null) => {
      const token = Date.now();
      inflight.current[metricId] = token;
      try {
        const r = await saveRating({ expertId, projectId, metricId, score, comment });
        if (inflight.current[metricId] !== token) return; // stale write, ignore
        setRatings((prev) => {
          const without = prev.filter((x) => x.metricId !== metricId);
          return [...without, r.rating];
        });
      } catch (e) {
        console.error("save rating failed", e);
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
