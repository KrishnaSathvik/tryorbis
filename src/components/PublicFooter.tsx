import { useNavigate } from "react-router-dom";
import { FeedbackDrawer } from "@/components/FeedbackDrawer";
import orbisLogo from "@/assets/orbis-logo.png";

export function PublicFooter() {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-border/50 py-8">
      <div className="max-w-5xl mx-auto px-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2">
            <img src={orbisLogo} alt="Orbis" className="h-5 w-5 dark-invert" />
            <span className="font-bold font-nunito text-gradient-primary text-sm">Orbis</span>
          </a>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/features")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Features
            </button>
            <button onClick={() => navigate("/community")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Community
            </button>
            <button onClick={() => navigate("/examples")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Examples
            </button>
            <button onClick={() => navigate("/changelog")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Changelog
            </button>
            <FeedbackDrawer />
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">&copy; {new Date().getFullYear()} Orbis. All rights reserved.</p>
      </div>
    </footer>
  );
}
