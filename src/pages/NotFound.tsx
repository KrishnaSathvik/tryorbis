import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import orbisLogo from "@/assets/orbis-logo.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center space-y-6 max-w-md animate-fade-in">
        <a href="/"><img src={orbisLogo} alt="Orbis" className="h-12 w-12 mx-auto dark-invert opacity-40" /></a>
        <div className="space-y-2">
          <h1 className="text-6xl font-bold font-nunito text-gradient-primary">404</h1>
          <p className="text-lg text-muted-foreground">This page doesn't exist or has been moved.</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" className="rounded-full gap-2" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Button>
          <Link to="/">
            <Button className="rounded-full gap-2 bg-foreground text-background hover:bg-foreground/90">
              <Home className="h-4 w-4" /> Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
