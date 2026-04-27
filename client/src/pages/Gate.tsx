import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useExpertIdentity } from "../hooks/useExpertId";
import { installVault } from "../lib/storage";

export default function Gate() {
  const navigate = useNavigate();
  const { expert, setName } = useExpertIdentity();
  const [input, setInput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    if (v.length < 2) {
      setErr("At least 2 characters.");
      return;
    }
    setName(v);
    navigate("/", { replace: true });
  };

  const onContinue = () => navigate("/", { replace: true });

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const v = JSON.parse(text);
      const restored = installVault(v);
      setErr(null);
      navigate("/", { replace: true });
      // notify any mounted listeners (same-tab writes don't fire 'storage')
      window.dispatchEvent(new StorageEvent("storage", { key: "hosq.expert" }));
      console.info("Restored vault for", restored.name);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Could not read vault file.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <img src="/logos/hosq-logo-black.svg" alt="hosq" className="h-7 mb-10" />
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted mb-3">HOSQ Expert Review</div>
        <h1 className="font-bold text-[52px] leading-[0.95] text-ink mb-5">
          Claim your name.
        </h1>
        <p className="text-muted mb-10 leading-relaxed text-[15px]">
          Your name is your identifier. Type it again on any browser or device to
          sync your ratings and pick up where you left off. No password, no
          email — pick a name only you'll use.
        </p>

        {expert && (
          <div className="mb-8 p-5 rounded-card bg-white border-l-[4px] border-coral">
            <div className="text-[10px] uppercase tracking-wider text-muted mb-1">Continue as</div>
            <div className="font-bold text-ink text-2xl mb-3">{expert.name}</div>
            <button
              type="button"
              onClick={onContinue}
              className="px-5 py-2 rounded-pill bg-coral text-white text-sm font-medium hover:bg-coral/90 transition"
            >
              Enter →
            </button>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-[10px] uppercase tracking-wider text-muted mb-2">
              {expert ? "Or start fresh with another name" : "Your name"}
            </label>
            <input
              id="name"
              autoFocus={!expert}
              autoComplete="off"
              value={input}
              onChange={(e) => { setInput(e.target.value); setErr(null); }}
              placeholder="e.g. Anna K"
              className="underline-input text-2xl"
            />
          </div>
          {err && <div className="text-sm text-coral">{err}</div>}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              disabled={input.trim().length < 2}
              className="px-6 py-3 rounded-pill bg-coral text-white hover:bg-coral/90 transition text-sm font-medium disabled:bg-hairline disabled:text-muted disabled:cursor-not-allowed"
            >
              Begin →
            </button>
            <label className="px-5 py-3 rounded-pill bg-white border border-hairline text-ink hover:border-coral transition text-sm font-medium cursor-pointer">
              Restore from file
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json,.hosq"
                className="hidden"
                onChange={onImport}
              />
            </label>
          </div>
        </form>

        <p className="mt-12 text-[11px] text-muted leading-relaxed">
          Your progress is saved on this device as you rate. When you come back —
          here or anywhere else — type the same name to sync.
        </p>
      </div>
    </div>
  );
}
