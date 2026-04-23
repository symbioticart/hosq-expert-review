import { useEffect, useState } from "react";
import { loadAiEval, loadMeta } from "../lib/api";
import type { AiEvaluation, ProjectMeta } from "../lib/types";

export function useProject(projectId: string | null) {
  const [meta, setMeta] = useState<ProjectMeta | null>(null);
  const [ai, setAi] = useState<AiEvaluation | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let alive = true;
    setMeta(null); setAi(null); setError(null);
    Promise.all([loadMeta(projectId), loadAiEval(projectId)])
      .then(([m, a]) => {
        if (!alive) return;
        setMeta(m); setAi(a);
      })
      .catch((e) => alive && setError(e));
    return () => { alive = false; };
  }, [projectId]);

  return { meta, ai, error, loading: !meta || !ai };
}
