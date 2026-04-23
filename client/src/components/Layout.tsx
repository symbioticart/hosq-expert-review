import { Link, useNavigate } from "react-router-dom";
import { useExpertIdentity } from "../hooks/useExpertId";

export function Header({ rightSlot }: { rightSlot?: React.ReactNode }) {
  const { expert, clear } = useExpertIdentity();
  const navigate = useNavigate();

  const onSwitch = () => {
    if (!confirm("Switch expert? Your work is kept on this device (and on the server) — you can come back by typing the same name again.")) return;
    clear();
    navigate("/start", { replace: true });
  };

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
          {expert && (
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>
                expert <strong className="text-ink font-medium">{expert.name}</strong>
              </span>
              <button
                type="button"
                onClick={onSwitch}
                className="px-2 py-1 rounded-pill border border-hairline hover:border-coral hover:text-coral transition"
                title="Switch expert"
              >
                switch
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
