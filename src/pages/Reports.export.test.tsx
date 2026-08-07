import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { axe } from "@/test/axe";
import { toast } from "sonner";

const getMyGeneratorRunsMock = vi.fn();
const getMyValidationReportsMock = vi.fn();
const getMyBacklogMock = vi.fn();
const trackMock = vi.fn();
const downloadMarkdownFileMock = vi.fn();

vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: () => {} }));
vi.mock("@/lib/db", () => ({
  getMyGeneratorRuns: (...args: unknown[]) => getMyGeneratorRunsMock(...args),
  getMyValidationReports: (...args: unknown[]) =>
    getMyValidationReportsMock(...args),
  getMyBacklog: (...args: unknown[]) => getMyBacklogMock(...args),
  addToBacklogDb: vi.fn(),
}));
vi.mock("@/lib/analytics", async () => {
  const actual = await vi.importActual<typeof import("@/lib/analytics")>(
    "@/lib/analytics",
  );
  return { ...actual, track: (...args: unknown[]) => trackMock(...args) };
});
vi.mock("@/lib/downloadMarkdown", () => ({
  downloadMarkdownFile: (...args: unknown[]) =>
    downloadMarkdownFileMock(...args),
}));
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
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { reply: "ok" }, error: null }),
    },
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

Element.prototype.scrollIntoView = vi.fn();

describe("Reports Markdown export", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    getMyBacklogMock.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it("does not show validation Export Markdown on generator History details", async () => {
    const user = userEvent.setup();
    getMyValidationReportsMock.mockResolvedValue([]);
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
          },
        ],
        problem_clusters: [],
      },
    ]);

    render(
      <MemoryRouter initialEntries={["/history"]}>
        <Reports />
      </MemoryRouter>,
    );

    await user.click(
      await screen.findByRole("button", { name: /generator: founders × saas/i }),
    );
    expect(
      screen.queryByRole("button", { name: /^export markdown$/i }),
    ).not.toBeInTheDocument();
  });

  it("exports History validation Markdown with snake_case mapping and keyboard activation", async () => {
    const user = userEvent.setup();
    getMyGeneratorRunsMock.mockResolvedValue([]);
    getMyValidationReportsMock.mockResolvedValue([
      {
        id: "val-1",
        created_at: "2026-08-06T11:00:00.000Z",
        idea_text: "Park Trip Planner",
        verdict: "Build",
        scores: { demand: 70, pain: 60, competition: 40, mvpFeasibility: 50 },
        pros: ["a"],
        cons: ["b"],
        gap_opportunities: ["First-time visitor planning"],
        mvp_wedge: "Day-one itinerary wedge",
        kill_test: "If nobody completes an itinerary, kill it.",
        competitors: [],
        evidence_links: ["https://example.com/history"],
        market_timing: {
          phase: "growing",
          summary: "Demand is accelerating.",
          signals: ["Rising park visitation"],
        },
      },
    ]);

    render(
      <MemoryRouter initialEntries={["/history"]}>
        <Reports />
      </MemoryRouter>,
    );

    await user.click(
      await screen.findByRole("button", {
        name: /validation: park trip planner/i,
      }),
    );

    const exportButton = await screen.findByRole("button", {
      name: /^export markdown$/i,
    });
    expect(exportButton).toBeInTheDocument();

    const pathnameBefore = window.location.pathname;
    exportButton.focus();
    expect(exportButton).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(downloadMarkdownFileMock).toHaveBeenCalledTimes(1);
    const [markdown] = downloadMarkdownFileMock.mock.calls[0] as [string, string];
    expect(markdown).toContain("# Orbis Validation Report");
    expect(markdown).toContain("First-time visitor planning");
    expect(markdown).toContain("Day-one itinerary wedge");
    expect(markdown).toContain("If nobody completes an itinerary, kill it.");
    expect(markdown).toContain("## Market Timing");
    expect(markdown).toContain("Demand is accelerating.");

    expect(trackMock).toHaveBeenCalledWith("export_markdown", {
      type: "validation",
    });
    expect(
      trackMock.mock.calls.filter(([event]) => event === "export_markdown"),
    ).toHaveLength(1);
    expect(trackMock).not.toHaveBeenCalledWith(
      "next_step_click",
      expect.objectContaining({ action: "export" }),
    );
    expect(toast.success).toHaveBeenCalledWith("Markdown report exported");
    expect(window.location.pathname).toBe(pathnameBefore);
    expect(
      screen.getByRole("button", { name: /validation: park trip planner/i }),
    ).toBeInTheDocument();
    expect(await axe(exportButton)).toHaveNoViolations();
  });
});
