import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import orbisLogo from "@/assets/orbis-logo.png";

export function PublicHeader() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2">
          <img src={orbisLogo} alt="Orbis" className="h-6 w-6 sm:h-7 sm:w-7 dark-invert" />
          <span className="text-lg sm:text-xl font-bold tracking-tight font-nunito text-gradient-primary">Orbis</span>
        </a>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex rounded-full" onClick={() => navigate("/features")}>
            Features
          </Button>
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex rounded-full" onClick={() => navigate("/community")}>
            Community
          </Button>
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex rounded-full" onClick={() => navigate("/examples")}>
            Examples
          </Button>
          <ThemeToggle />
          <Button onClick={() => navigate(user ? "/dashboard" : "/try")} size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
            {user ? "Dashboard" : "Try Free"}
          </Button>
        </div>
      </div>
    </header>
  );
}
