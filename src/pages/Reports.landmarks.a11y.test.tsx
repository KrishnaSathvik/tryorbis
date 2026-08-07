import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { axe } from "@/test/axe";
import { withHistoryInstance } from "@/lib/historyLandmarkLabel";

const getMyGeneratorRunsMock = vi.fn();
const getMyValidationReportsMock = vi.fn();
const getMyBacklogMock = vi.fn();

vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: () => {} }));
vi.mock("@/lib/db", () => ({
  getMyGeneratorRuns: (...args: unknown[]) => getMyGeneratorRunsMock(...args),
  getMyValidationReports: (...args: unknown[]) =>
    getMyValidationReportsMock(...args),
  getMyBacklog: (...args: unknown[]) => getMyBacklogMock(...args),
  addToBacklogDb: vi.fn(),
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
vi.mock("@/lib/analytics", async () => {
  const actual = await vi.importActual<typeof import("@/lib/analytics")>(
    "@/lib/analytics",
  );
  return { ...actual, track: vi.fn() };
});
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

/** Same calendar minute; seconds differ so sort order stays stable (newest first). */
const VAL_NEWER = "2026-08-06T16:00:45.000Z";
const VAL_OLDER = "2026-08-06T16:00:00.000Z";
const RUN_NEWER = "2026-08-05T14:00:45.000Z";
const RUN_OLDER = "2026-08-05T14:00:00.000Z";

describe("Reports History landmark uniqueness", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    getMyBacklogMock.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps unique landmarks when two same-name validation reports share a minute", async () => {
    const user = userEvent.setup();
    getMyGeneratorRunsMock.mockResolvedValue([]);
    getMyValidationReportsMock.mockResolvedValue([
      {
        id: "val-older",
        created_at: VAL_OLDER,
        idea_text: "Park Trip Planner",
        verdict: "Build",
        scores: { demand: 70, pain: 60, competition: 40, mvpFeasibility: 50 },
        pros: ["a"],
        cons: ["b"],
        gap_opportunities: [],
        competitors: [],
        evidence_links: [],
      },
      {
        id: "val-newer",
        created_at: VAL_NEWER,
        idea_text: "Park Trip Planner",
        verdict: "Build",
        scores: { demand: 71, pain: 61, competition: 41, mvpFeasibility: 51 },
        pros: ["a"],
        cons: ["b"],
        gap_opportunities: [],
        competitors: [],
        evidence_links: [],
      },
    ]);

    render(
      <MemoryRouter initialEntries={["/history"]}>
        <Reports />
      </MemoryRouter>,
    );

    const triggers = await screen.findAllByRole("button", {
      name: /validation: park trip planner/i,
    });
    expect(triggers).toHaveLength(2);
    await user.click(triggers[0]);
    await user.click(triggers[1]);

    // History list is newest-first: newer → history item 1, older → item 2.
    const expectedNewer = withHistoryInstance(
      "Recommended next step for validation report Park Trip Planner",
      VAL_NEWER,
      1,
    );
    const expectedOlder = withHistoryInstance(
      "Recommended next step for validation report Park Trip Planner",
      VAL_OLDER,
      2,
    );
    expect(expectedNewer).not.toBe(expectedOlder);
    expect(expectedNewer).toContain("history item 1");
    expect(expectedOlder).toContain("history item 2");

    expect(
      screen.getByRole("region", { name: expectedNewer }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: expectedOlder }),
    ).toBeInTheDocument();

    const followUpButtons = screen.getAllByRole("button", {
      name: /ask a follow-up question/i,
    });
    expect(followUpButtons).toHaveLength(2);
    await user.click(followUpButtons[0]);
    await user.click(followUpButtons[1]);

    expect(
      screen.getByRole("region", {
        name: withHistoryInstance(
          "Follow-up chat for validation report Park Trip Planner",
          VAL_NEWER,
          1,
        ),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", {
        name: withHistoryInstance(
          "Follow-up chat for validation report Park Trip Planner",
          VAL_OLDER,
          2,
        ),
      }),
    ).toBeInTheDocument();

    const panel = screen.getByRole("tabpanel");
    expect(await axe(panel)).toHaveNoViolations();
  });

  it("keeps unique landmarks when two matching generator runs share a minute", async () => {
    const user = userEvent.setup();
    getMyValidationReportsMock.mockResolvedValue([]);
    getMyGeneratorRunsMock.mockResolvedValue([
      {
        id: "run-older",
        created_at: RUN_OLDER,
        persona: "Founders",
        category: "SaaS",
        idea_suggestions: [
          {
            id: "idea-a",
            name: "SQL Buddy",
            description: "Helps write SQL",
            demandScore: 80,
          },
        ],
        problem_clusters: [],
      },
      {
        id: "run-newer",
        created_at: RUN_NEWER,
        persona: "Founders",
        category: "SaaS",
        idea_suggestions: [
          {
            id: "idea-b",
            name: "SQL Buddy",
            description: "Helps write SQL again",
            demandScore: 82,
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

    const triggers = await screen.findAllByRole("button", {
      name: /generator: founders × saas/i,
    });
    expect(triggers).toHaveLength(2);
    await user.click(triggers[0]);
    await user.click(triggers[1]);

    const expectedNewer = withHistoryInstance(
      "Recommended next step for generator report SQL Buddy",
      RUN_NEWER,
      1,
    );
    const expectedOlder = withHistoryInstance(
      "Recommended next step for generator report SQL Buddy",
      RUN_OLDER,
      2,
    );
    expect(expectedNewer).not.toBe(expectedOlder);
    expect(screen.getByRole("region", { name: expectedNewer })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: expectedOlder })).toBeInTheDocument();

    const followUpButtons = screen.getAllByRole("button", {
      name: /ask a follow-up question/i,
    });
    await user.click(followUpButtons[0]);
    await user.click(followUpButtons[1]);

    expect(
      screen.getByRole("region", {
        name: withHistoryInstance(
          "Follow-up chat for generator report Founders × SaaS",
          RUN_NEWER,
          1,
        ),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", {
        name: withHistoryInstance(
          "Follow-up chat for generator report Founders × SaaS",
          RUN_OLDER,
          2,
        ),
      }),
    ).toBeInTheDocument();

    const panel = screen.getByRole("tabpanel");
    expect(await axe(panel)).toHaveNoViolations();
  });
});
