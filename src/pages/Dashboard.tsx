import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Lightbulb, ClipboardCheck, TrendingUp, CheckCircle, Archive, Hand } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { PostQuotaContinuationPanel } from "@/components/PostQuotaContinuationPanel";
import { DashboardRecentActivity } from "@/components/DashboardRecentActivity";
import {
  EMPTY_DASHBOARD_OVERVIEW,
  getDashboardOverview,
  type DashboardOverview,
} from "@/lib/dashboardOverview";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/utils";
import { consumeFocusSectionState } from "@/lib/focusSection";
import { isRouterStateRecord } from "@/lib/validatePrefill";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; overview: DashboardOverview }
  | { status: "error" };

const entryLinkClassName = cn(
  "block h-full rounded-2xl outline-none",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

function EntryCards() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Link to="/generate" className={entryLinkClassName} aria-label="Find Ideas to Build">
        <Card className="h-full group card-warm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <CardContent className="p-8">
            <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center mb-5 shadow-sm">
              <Lightbulb className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold font-nunito mb-2">Find Ideas to Build</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Discover real problems people are facing. Mine complaints, cluster pain points, and generate product ideas backed by evidence.
            </p>
          </CardContent>
        </Card>
      </Link>
      <Link to="/validate" className={entryLinkClassName} aria-label="Validate My Idea">
        <Card className="h-full group card-warm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <CardContent className="p-8">
            <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center mb-5 shadow-sm">
              <ClipboardCheck className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold font-nunito mb-2">Validate My Idea</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Test if your idea is worth building. Get demand scores, competitor analysis, and a clear Build / Pivot / Skip verdict.
            </p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

function FirstRunSection() {
  return (
    <section aria-labelledby="dashboard-first-run-heading" className="space-y-4">
      <div>
        <h2
          id="dashboard-first-run-heading"
          className="text-xl font-semibold font-nunito tracking-tight"
        >
          Start your first research
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Explore a problem space or test an idea you already have.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Link to="/generate" className={entryLinkClassName} aria-label="Find product ideas">
          <Card className="h-full group card-warm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-8">
              <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center mb-5 shadow-sm">
                <Lightbulb className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold font-nunito mb-2">Find product ideas</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Discover real problems people are facing. Mine complaints, cluster pain points, and generate product ideas backed by evidence.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/validate" className={entryLinkClassName} aria-label="Validate an idea">
          <Card className="h-full group card-warm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-8">
              <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center mb-5 shadow-sm">
                <ClipboardCheck className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold font-nunito mb-2">Validate an idea</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Test if your idea is worth building. Get demand scores, competitor analysis, and a clear Build / Pivot / Skip verdict.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </section>
  );
}

function StatsGrid({ stats }: { stats: DashboardOverview["stats"] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[
        { label: "Ideas Generated", value: stats.ideasGenerated, icon: TrendingUp },
        { label: "Ideas Validated", value: stats.ideasValidated, icon: CheckCircle },
        { label: "Saved Ideas", value: stats.ideasInBacklog, icon: Archive },
      ].map((stat) => (
        <Card key={stat.label} className="rounded-xl bg-secondary border-0">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-card flex items-center justify-center shadow-sm">
              <stat.icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold font-nunito">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-semibold">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-busy="true" aria-label="Loading statistics">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="rounded-xl bg-secondary border-0">
          <CardContent className="p-5 flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RecentSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading recent research">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="rounded-2xl border-border/50">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-8 w-32 rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Dashboard() {
  usePageTitle("Dashboard");
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user } = useAuth();
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const requestIdRef = useRef(0);
  const inFlightRef = useRef(false);
  const userId = user?.id ?? null;
  const focusHandledRef = useRef(false);

  useEffect(() => {
    if (focusHandledRef.current) return;
    if (!isRouterStateRecord(location.state)) return;
    if (!Object.prototype.hasOwnProperty.call(location.state, "focusSection")) {
      return;
    }
    const { focusSection, nextState } = consumeFocusSectionState(location.state);
    focusHandledRef.current = true;
    if (focusSection === "my-ideas") {
      navigate("/ideas", {
        replace: true,
        state: {
          ...(nextState ?? {}),
          focusSection: "my-ideas",
        },
      });
      return;
    }
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      { replace: true, state: nextState },
    );
  }, [location.state, location.pathname, location.search, location.hash, navigate]);

  const loadOverview = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const requestId = ++requestIdRef.current;
    setLoadState({ status: "loading" });

    try {
      const overview = await getDashboardOverview(3);
      if (requestId !== requestIdRef.current) return;
      setLoadState({ status: "ready", overview });
    } catch {
      if (requestId !== requestIdRef.current) return;
      setLoadState({ status: "error" });
    } finally {
      if (requestId === requestIdRef.current) {
        inFlightRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    // Invalidate any in-flight response from a previous user
    requestIdRef.current += 1;
    inFlightRef.current = false;
    setLoadState({ status: "loading" });
    void loadOverview();
  }, [userId, loadOverview]);

  const overview =
    loadState.status === "ready" ? loadState.overview : EMPTY_DASHBOARD_OVERVIEW;
  const hasActivity = overview.recentActivity.length > 0;
  const isLoading = loadState.status === "loading";
  const isError = loadState.status === "error";

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in">
      <div>
        <h1
          id="dashboard-welcome"
          tabIndex={-1}
          className="text-3xl font-bold tracking-tight font-nunito flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}
          <Hand className="h-7 w-7 text-primary" aria-hidden="true" />
        </h1>
        <p className="text-muted-foreground mt-1">From problem discovery to product validation.</p>
      </div>

      <PostQuotaContinuationPanel />

      {isLoading && (
        <>
          <RecentSkeleton />
          <StatsSkeleton />
        </>
      )}

      {isError && (
        <div
          role="alert"
          className="rounded-2xl border border-border/60 bg-secondary/40 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
        >
          <p className="text-sm text-foreground">We couldn&apos;t load your dashboard.</p>
          <Button
            type="button"
            size="sm"
            className="rounded-full min-h-9 shrink-0"
            onClick={() => {
              void loadOverview();
            }}
          >
            Try again
          </Button>
        </div>
      )}

      {!isLoading && !isError && hasActivity && (
        <>
          <DashboardRecentActivity
            items={overview.recentActivity}
            onNavigate={(to, options) => navigate(to, options)}
          />
          <section aria-labelledby="dashboard-start-new-heading" className="space-y-4">
            <h2
              id="dashboard-start-new-heading"
              className="text-xl font-semibold font-nunito tracking-tight"
            >
              Start something new
            </h2>
            <EntryCards />
          </section>
          <StatsGrid stats={overview.stats} />
        </>
      )}

      {!isLoading && !isError && !hasActivity && (
        <>
          <FirstRunSection />
          <StatsGrid stats={overview.stats} />
        </>
      )}
    </div>
  );
}
