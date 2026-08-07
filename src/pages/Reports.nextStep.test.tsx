import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

const addToBacklogDbMock = vi.fn();
const getMyGeneratorRunsMock = vi.fn();
const getMyValidationReportsMock = vi.fn();
const getMyBacklogMock = vi.fn();
const trackMock = vi.fn();

vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: () => {} }));
vi.mock("@/lib/db", () => ({
  getMyGeneratorRuns: (...args: unknown[]) => getMyGeneratorRunsMock(...args),
  getMyValidationReports: (...args: unknown[]) =>
    getMyValidationReportsMock(...args),
  getMyBacklog: (...args: unknown[]) => getMyBacklogMock(...args),
  addToBacklogDb: (...args: unknown[]) => addToBacklogDbMock(...args),
}));
vi.mock("@/lib/analytics", async () => {
  const actual = await vi.importActual<typeof import("@/lib/analytics")>(
    "@/lib/analytics",
  );
  return {
    ...actual,
    track: (...args: unknown[]) => trackMock(...args),
  };
});
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/FollowUpChat", () => ({ FollowUpChat: () => null }));
vi.mock("@/components/IntelligenceSections", () => ({
  WtpSection: () => null,
  CompetitionDensitySection: () => null,
  MarketTimingSection: () => null,
  IcpSection: () => null,
  WorkaroundSection: () => null,
  FeatureGapSection: () => null,
  PlatformRiskSection: () => null,
  GtmStrategySection: () => null,
  PricingBenchmarkSection: () => null,
  DefensibilitySection: () => null,
}));

import Reports from "./Reports";

Element.prototype.scrollIntoView = vi.fn();

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="search">{location.search}</span>;
}

describe("Reports NextStepCard", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    addToBacklogDbMock.mockResolvedValue(undefined);
    getMyBacklogMock.mockResolvedValue([]);
    getMyGeneratorRunsMock.mockResolvedValue([
      {
        id: "run-1",
        created_at: "2026-08-06T12:00:00.000Z",
        persona: "Founders",
        category: "SaaS",
        idea_suggestions: [
          {
            name: "SQL Buddy",
            description: "Helps write SQL",
            demandScore: 80,
            mvpScope: "mvp",
            monetization: "sub",
          },
        ],
        problem_clusters: [{ theme: "Pain", painSummary: "Hard SQL", complaintCount: 2 }],
      },
    ]);
    getMyValidationReportsMock.mockResolvedValue([
      {
        id: "val-1",
        created_at: "2026-08-06T11:00:00.000Z",
        idea_text: "Park trip planner",
        verdict: "Build",
        scores: { demand: 70, pain: 60, competition: 40, mvpFeasibility: 50 },
        pros: ["a"],
        cons: ["b"],
        gap_opportunities: [],
        competitors: [],
        evidence_links: [],
      },
    ]);
  });

  afterEach(() => {
    cleanup();
  });

  it("shows Generate and Validate next-step cards in history details", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/history"]}>
        <Reports />
      </MemoryRouter>,
    );

    const genTrigger = await screen.findByRole("button", {
      name: /generator: founders × saas/i,
    });
    await user.click(genTrigger);
    expect(
      await screen.findByRole("button", { name: /validate “sql buddy”/i }),
    ).toBeInTheDocument();

    const valTrigger = screen.getByRole("button", {
      name: /validation: park trip planner/i,
    });
    await user.click(valTrigger);
    expect(
      await screen.findByRole("button", { name: /save this idea/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /back to all reports/i }),
    ).toBeInTheDocument();
  });

  it("back to all reports clears item query", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/history?item=validation%3Aval-1&tab=research"]}>
        <Routes>
          <Route
            path="/history"
            element={
              <>
                <Reports />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("button", { name: /save this idea/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("search").textContent).toContain("item=");

    await user.click(screen.getByRole("button", { name: /back to all reports/i }));
    await waitFor(() => {
      expect(screen.getByTestId("search").textContent).not.toContain("item=");
    });
    expect(screen.queryByRole("button", { name: /save this idea/i })).not.toBeInTheDocument();
  });
});
