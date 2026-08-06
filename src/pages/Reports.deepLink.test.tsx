import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";

const scrollIntoViewMock = vi.fn();
Element.prototype.scrollIntoView = scrollIntoViewMock;

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

function HistoryHarness({ initialPath }: { initialPath: string }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/history" element={<ReportsWithDeepLinkControl />} />
      </Routes>
    </MemoryRouter>
  );
}

function ReportsWithDeepLinkControl() {
  const navigate = useNavigate();
  return (
    <div>
      <button type="button" onClick={() => navigate("/history?item=generator:gen-1")}>
        Deep link generator
      </button>
      <Reports />
    </div>
  );
}

describe("History deep linking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
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

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("expands the matching generator item and automatically focuses the trigger", async () => {
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
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
    expect(scrollIntoViewMock).toHaveBeenCalled();
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
    await waitFor(() => {
      expect(trigger).toHaveFocus();
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

  it("keeps multiple artifacts open independently", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/history"]}>
        <Routes>
          <Route path="/history" element={<Reports />} />
        </Routes>
      </MemoryRouter>,
    );

    const generator = await screen.findByRole("button", {
      name: /generator: data teams × developer tools/i,
    });
    const validation = screen.getByRole("button", {
      name: /validation: park trip planner/i,
    });

    await user.click(generator);
    await user.click(validation);

    await waitFor(() => {
      expect(generator).toHaveAttribute("data-state", "open");
      expect(validation).toHaveAttribute("data-state", "open");
    });

    await user.click(generator);
    await waitFor(() => {
      expect(generator).toHaveAttribute("data-state", "closed");
      expect(validation).toHaveAttribute("data-state", "open");
    });
  });

  it("deep-links without closing an already-open item", async () => {
    const user = userEvent.setup();
    render(<HistoryHarness initialPath="/history" />);

    const validation = await screen.findByRole("button", {
      name: /validation: park trip planner/i,
    });
    await user.click(validation);
    await waitFor(() => {
      expect(validation).toHaveAttribute("data-state", "open");
    });

    await user.click(screen.getByRole("button", { name: /deep link generator/i }));

    const generator = await screen.findByRole("button", {
      name: /generator: data teams × developer tools/i,
    });
    await waitFor(() => {
      expect(generator).toHaveAttribute("data-state", "open");
      expect(validation).toHaveAttribute("data-state", "open");
    });
  });
});
