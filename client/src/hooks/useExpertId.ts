import { useCallback, useSyncExternalStore } from "react";
import {
  clearExpert,
  readExpert,
  slugify,
  writeExpert,
  type ExpertIdentity,
} from "../lib/storage";

let cached: ExpertIdentity | null = readExpertSafe();
let cacheStamp = 0;

function readExpertSafe(): ExpertIdentity | null {
  if (typeof window === "undefined") return null;
  return readExpert();
}

function refresh() {
  cached = readExpertSafe();
  cacheStamp++;
  for (const l of listeners) l();
}

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
function snapshot(): ExpertIdentity | null { return cached; }

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "hosq.expert" || e.key === null) refresh();
  });
}

export function useExpertIdentity(): {
  expert: ExpertIdentity | null;
  setName: (name: string) => ExpertIdentity;
  clear: () => void;
} {
  const expert = useSyncExternalStore(subscribe, snapshot, () => null);

  const setName = useCallback((name: string): ExpertIdentity => {
    const trimmed = name.trim();
    const id = slugify(trimmed);
    const e: ExpertIdentity = { id, name: trimmed, createdAt: Date.now() };
    writeExpert(e);
    refresh();
    return e;
  }, []);

  const clear = useCallback(() => {
    clearExpert();
    refresh();
  }, []);

  return { expert, setName, clear };
}

export function useExpertId(): [string, () => void] {
  const { expert, clear } = useExpertIdentity();
  return [expert?.id ?? "", clear];
}

// suppress unused warning
void cacheStamp;
