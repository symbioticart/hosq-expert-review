import { useEffect, useState } from "react";

const KEY = "hosq.expertId";

function makeUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useExpertId(): [string, () => void] {
  const [id, setId] = useState<string>(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem(KEY);
    if (saved) return saved;
    const fresh = makeUuid();
    localStorage.setItem(KEY, fresh);
    return fresh;
  });

  useEffect(() => {
    localStorage.setItem(KEY, id);
  }, [id]);

  const reset = () => {
    const fresh = makeUuid();
    localStorage.setItem(KEY, fresh);
    setId(fresh);
  };

  return [id, reset];
}
