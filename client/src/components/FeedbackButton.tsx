import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useExpertIdentity } from "../hooks/useExpertId";
import { submitFeedback } from "../lib/api";
import { cn } from "../lib/util";

type Kind = "bug" | "feature" | "idea";

const KIND_META: Record<Kind, { label: string; hint: string }> = {
  bug:     { label: "Bug",     hint: "Something broken or confusing — what did you expect vs. what happened?" },
  feature: { label: "Feature", hint: "A missing capability — what should the product do?" },
  idea:    { label: "Idea",    hint: "Open-ended thought, question, or general feedback." },
};

const PENDING_KEY = "hosq.feedback.pending";
const APP_VERSION =
  (typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_APP_VERSION) ||
  "dev";

interface PendingItem {
  kind: Kind;
  message: string;
  route: string;
  expertId: string | null;
  expertName: string | null;
  at: number;
}

function readPending(): PendingItem[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingItem[]) : [];
  } catch {
    return [];
  }
}

function writePending(items: PendingItem[]): void {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(items)); } catch { /* ignore */ }
}

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="no-print inline-flex items-center gap-1.5 px-3 py-1 rounded-pill border border-hairline bg-white text-xs text-ink hover:border-coral hover:text-coral transition"
        title="Request a feature, report a bug, or share an idea"
      >
        <span aria-hidden>✦</span>
        Request a feature
      </button>
      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  );
}

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const { expert } = useExpertIdentity();
  const [kind, setKind] = useState<Kind>("feature");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "queued" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSend();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    setTimeout(() => textRef.current?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ctx = () => {
    const route = window.location.pathname + window.location.search;
    const segs = window.location.pathname.split("/").filter(Boolean);
    const projectIdx = segs.indexOf("project");
    const projectSlug = projectIdx >= 0 ? segs[projectIdx + 1] ?? null : null;
    const params = new URLSearchParams(window.location.search);
    const metricId = params.get("m");
    return { route, projectSlug, metricId };
  };

  const handleSend = async () => {
    const msg = message.trim();
    if (msg.length < 3) { setErr("Please write a few more words."); return; }
    setStatus("sending");
    setErr(null);
    const { route, projectSlug, metricId } = ctx();
    const payload = {
      expertId: expert?.id ?? null,
      expertName: expert?.name ?? null,
      kind,
      message: msg,
      route,
      projectId: projectSlug,
      metricId,
      appVersion: APP_VERSION,
    };
    try {
      await submitFeedback(payload);
      setStatus("done");
      setTimeout(onClose, 1400);
    } catch {
      const pending = readPending();
      pending.push({
        kind,
        message: msg,
        route,
        expertId: expert?.id ?? null,
        expertName: expert?.name ?? null,
        at: Date.now(),
      });
      writePending(pending);
      setStatus("queued");
      setTimeout(onClose, 1800);
    }
  };

  const done = status === "done" || status === "queued";

  // Confirm before discarding a draft if the user typed enough to lose
  const safeClose = () => {
    if (!done && message.trim().length > 10) {
      const ok = confirm("Discard your draft? The text you've typed will be lost.");
      if (!ok) return;
    }
    onClose();
  };

  return createPortal(
    <div className="no-print fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-ink/40" onClick={safeClose} />
      <div className="relative w-full max-w-[520px] my-auto bg-white rounded-card shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
          <h2 className="font-bold text-ink text-lg">Share your feedback</h2>
          <button type="button" onClick={safeClose} aria-label="Close" className="text-muted hover:text-ink text-lg">✕</button>
        </div>

        {done ? (
          <div className="px-5 py-8 text-center">
            <div className="text-3xl mb-2">{status === "done" ? "✓" : "⏱"}</div>
            <p className="text-ink font-medium">
              {status === "done" ? "Thanks — feedback sent." : "Saved locally. Will retry when online."}
            </p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            <div className="flex gap-1.5">
              {(Object.keys(KIND_META) as Kind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-pill text-sm font-medium border transition",
                    kind === k
                      ? "bg-ink text-cream border-ink"
                      : "bg-white text-ink border-hairline hover:border-ink",
                  )}
                >
                  {KIND_META[k].label}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted leading-relaxed">{KIND_META[kind].hint}</p>

            <textarea
              ref={textRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={4000}
              placeholder={kind === "bug" ? "Steps to reproduce, what you saw, what you expected…" : "Describe the idea or request…"}
              className="w-full rounded-card border border-hairline bg-white px-3 py-2 text-sm text-ink placeholder-muted/70 focus:outline-none focus:border-coral transition resize-y"
            />

            <div className="flex items-center justify-between text-[11px] text-muted">
              <span>
                We attach your current page and name so we can follow up.
              </span>
              <span>{message.length}/4000</span>
            </div>

            {err && <div className="text-sm text-coral">{err}</div>}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={safeClose}
                className="px-4 py-2 rounded-pill text-sm text-muted hover:text-ink transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={status === "sending" || message.trim().length < 3}
                aria-busy={status === "sending"}
                className="px-5 py-2 rounded-pill bg-ink text-cream text-sm font-medium hover:bg-coral transition disabled:bg-hairline disabled:text-muted disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {status === "sending" && (
                  <span aria-hidden className="h-3 w-3 rounded-pill border-2 border-cream border-t-transparent animate-spin" />
                )}
                {status === "sending" ? "Sending…" : "Send"}
              </button>
            </div>
            <div className="text-[10px] text-muted/80 text-right">
              <kbd className="font-mono bg-zebra px-1 py-0.5 rounded">⌘↵</kbd> to send
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export async function flushPendingFeedback(): Promise<void> {
  const pending = readPending();
  if (!pending.length) return;
  const leftover: PendingItem[] = [];
  for (const p of pending) {
    try {
      await submitFeedback({
        expertId: p.expertId,
        expertName: p.expertName,
        kind: p.kind,
        message: p.message,
        route: p.route,
        appVersion: APP_VERSION,
      });
    } catch {
      leftover.push(p);
    }
  }
  writePending(leftover);
}
