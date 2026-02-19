import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, ClipboardCheck, Bookmark, X, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const TOUR_KEY = "orbis_onboarding_complete";

const steps = [
  {
    title: "Welcome to Orbis! 🚀",
    description: "Let me show you around. Orbis helps you discover, validate, and track startup ideas — all backed by real market research.",
    icon: Sparkles,
    route: "/dashboard",
  },
  {
    title: "Chat with Orbis AI",
    description: "Meet your AI startup advisor. Brainstorm ideas, discuss strategy, get go-to-market advice, or just think out loud — Orbis AI is always here to help.",
    icon: Sparkles,
    route: "/chat",
  },
  {
    title: "Generate Ideas",
    description: "Describe a problem space and Orbis will mine real complaints from Reddit, forums, and reviews to surface product opportunities with demand scores.",
    icon: Lightbulb,
    route: "/generate",
  },
  {
    title: "Validate Ideas",
    description: "Test any idea against real market data. Get demand, pain, competition, and feasibility scores plus a clear Build / Pivot / Skip verdict.",
    icon: ClipboardCheck,
    route: "/validate",
  },
  {
    title: "Save & Track",
    description: "Save promising ideas to your pipeline. Add notes, change status, and track your journey from discovery to product.",
    icon: Bookmark,
    route: "/ideas",
  },
];

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const shownRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Don't show while auth is loading, or if already shown this session, or if no user
    if (loading || shownRef.current || !user) return;
    const done = localStorage.getItem(TOUR_KEY);
    if (!done && location.pathname === "/dashboard") {
      shownRef.current = true;
      setVisible(true);
    }
  }, [location.pathname, loading, user]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(TOUR_KEY, "true");
    setVisible(false);
    navigate("/dashboard");
  };

  if (!visible) return null;

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-md rounded-[28px] shadow-2xl border-0 bg-card">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <h2 className="text-lg font-bold font-nunito">{step.title}</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 pt-1">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'w-6 bg-primary' : i < currentStep ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-accent'}`} />
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleDismiss}>
              Skip tour
            </Button>
            <Button size="sm" className="rounded-full px-5" onClick={handleNext}>
              {isLast ? "Get Started" : "Next"} <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
