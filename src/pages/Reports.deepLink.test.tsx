import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

Element.prototype.scrollIntoView = vi.fn();

const getMyGeneratorRunsMock = vi.fn();
const getMyValidationReportsMock = vi.fn();

vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: () => {} }));
vi.mock("@/lib/db", () => ({
  getMyGeneratorRuns: () => getMyGeneratorRunsMock(),
  getMyValidationReports: () => getMyValidationReportsMock(),
  addToBacklogDb: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [] }),
      }),
      delete: () => Promise.resolve({}),
    }),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
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

describe("History deep linking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMyGeneratorRunsMock.mockResolvedValue([
      {
        id: "gen-1",
        created_at: "2026-08-06T10:00:00.000Z",
        persona: "Data teams",
        category: "Developer tools",
        idea_suggestions: [{ name: "SQL Prompt Buddy", description: "x" }],
      },
    ]);
    getMyValidationReportsMock.mockResolvedValue([
      {
        id: "val-1",
        created_at: "2026-08-06T11:00:00.000Z",
        idea_text: "Park trip planner",
        verdict: "Build",
        scores: { demand: 70, pain: 60, competition: 40, mvpFeasibility: 50 },
        pros: [],
        cons: [],
        gap_opportunities: [],
        competitors: [],
        evidence_links: [],
      },
    ]);
  });

  it("expands the matching generator item and focuses the trigger", async () => {
    render(
      <MemoryRouter initialEntries={["/history?item=generator:gen-1"]}>
        <Routes>
          <Route path="/history" element={<Reports />} />
        </Routes>
      </MemoryRouter>,
    );

    const trigger = await screen.findByRole("button", {
      name: /generator: data teams × developer tools/i,
    });
    await waitFor(() => {
      expect(trigger).toHaveAttribute("data-state", "open");
    });
    expect(trigger.hasAttribute("data-history-focus-target")).toBe(true);
    // Logical focus: trigger is focusable and was targeted after expand
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
  });

  it("expands the matching validation item", async () => {
    render(
      <MemoryRouter initialEntries={["/history?item=validation:val-1"]}>
        <Routes>
          <Route path="/history" element={<Reports />} />
        </Routes>
      </MemoryRouter>,
    );

    const trigger = await screen.findByRole("button", {
      name: /validation: park trip planner/i,
    });
    await waitFor(() => {
      expect(trigger).toHaveAttribute("data-state", "open");
    });
  });

  it("renders normally when target is missing", async () => {
    render(
      <MemoryRouter initialEntries={["/history?item=generator:missing"]}>
        <Routes>
          <Route path="/history" element={<Reports />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/that research item wasn't found/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/data teams × developer tools/i)).toBeInTheDocument();
  });

  it("allows collapsing an auto-opened item", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/history?item=validation:val-1"]}>
        <Routes>
          <Route path="/history" element={<Reports />} />
        </Routes>
      </MemoryRouter>,
    );

    const trigger = await screen.findByRole("button", {
      name: /validation: park trip planner/i,
    });
    await waitFor(() => {
      expect(trigger).toHaveAttribute("data-state", "open");
    });
    await user.click(trigger);
    await waitFor(() => {
      expect(trigger).toHaveAttribute("data-state", "closed");
    });
  });
});
