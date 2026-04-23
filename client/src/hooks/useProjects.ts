import { useEffect, useState } from "react";
import { loadManifest, loadMetrics } from "../lib/api";
import type { Manifest, MetricsFile } from "../lib/types";

export function useProjectsAndMetrics() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [metrics, setMetrics] = useState<MetricsFile | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([loadManifest(), loadMetrics()])
      .then(([mf, mt]) => {
        if (!alive) return;
        setManifest(mf);
        setMetrics(mt);
      })
      .catch((e) => alive && setError(e));
    return () => { alive = false; };
  }, []);

  return { manifest, metrics, error, loading: !manifest || !metrics };
}
