import { Link } from "react-router-dom";
import { useExpertId } from "../hooks/useExpertId";

export function Header({ rightSlot }: { rightSlot?: React.ReactNode }) {
  const [expertId, reset] = useExpertId();
  const shortId = expertId.slice(0, 8);

  return (
    <header className="no-print sticky top-0 z-30 bg-cream/90 backdrop-blur border-b border-hairline">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between px-8 py-4">
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/logos/hosq-logo-black.svg" alt="hosq" className="h-6 w-auto" />
          <span className="text-ink text-sm font-medium tracking-wide opacity-70 group-hover:opacity-100 transition">
            Expert Review
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {rightSlot}
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="font-mono">expert {shortId}</span>
            <button
              type="button"
              onClick={() => {
                if (confirm("Reset expert identity? Your current progress will be disconnected (data is kept on the server).")) {
                  reset();
                  window.location.reload();
                }
              }}
              className="px-2 py-1 rounded-pill border border-hairline hover:border-coral hover:text-coral transition"
              title="Reset expert identity"
            >
              reset
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
