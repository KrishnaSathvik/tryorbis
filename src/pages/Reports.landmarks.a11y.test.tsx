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

const VAL_A = "2026-08-06T16:00:00.000Z";
const VAL_B = "2026-08-06T19:00:00.000Z";
const RUN_A = "2026-08-05T14:00:00.000Z";
const RUN_B = "2026-08-05T18:30:00.000Z";

describe("Reports History landmark uniqueness", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    getMyBacklogMock.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps unique landmarks when two same-name validation reports are open", async () => {
    const user = userEvent.setup();
    getMyGeneratorRunsMock.mockResolvedValue([]);
    getMyValidationReportsMock.mockResolvedValue([
      {
        id: "val-a",
        created_at: VAL_A,
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
        id: "val-b",
        created_at: VAL_B,
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
    const expectedA = withHistoryInstance(
      "Recommended next step for validation report Park Trip Planner",
      VAL_A,
    );
    const expectedB = withHistoryInstance(
      "Recommended next step for validation report Park Trip Planner",
      VAL_B,
    );
    expect(expectedA).not.toBe(expectedB);

    expect(
      screen.getByRole("region", { name: expectedA }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: expectedB }),
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
          VAL_A,
        ),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", {
        name: withHistoryInstance(
          "Follow-up chat for validation report Park Trip Planner",
          VAL_B,
        ),
      }),
    ).toBeInTheDocument();

    const panel = screen.getByRole("tabpanel");
    // Combined History content: prove landmark-unique with same idea names.
    // Disable only pre-existing Validation History chrome issues unrelated to
    // this labeling fix (h4 without intervening levels; Lucide Info as
    // PopoverTrigger receiving aria-expanded from Radix).
    expect(
      await axe(panel, {
        rules: {
          "heading-order": { enabled: false },
          "aria-allowed-attr": { enabled: false },
        },
      }),
    ).toHaveNoViolations();
  });

  it("keeps unique landmarks when two matching generator runs are open", async () => {
    const user = userEvent.setup();
    getMyValidationReportsMock.mockResolvedValue([]);
    getMyGeneratorRunsMock.mockResolvedValue([
      {
        id: "run-a",
        created_at: RUN_A,
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
        id: "run-b",
        created_at: RUN_B,
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

    const expectedA = withHistoryInstance(
      "Recommended next step for generator report SQL Buddy",
      RUN_A,
    );
    const expectedB = withHistoryInstance(
      "Recommended next step for generator report SQL Buddy",
      RUN_B,
    );
    expect(expectedA).not.toBe(expectedB);
    expect(screen.getByRole("region", { name: expectedA })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: expectedB })).toBeInTheDocument();

    const followUpButtons = screen.getAllByRole("button", {
      name: /ask a follow-up question/i,
    });
    await user.click(followUpButtons[0]);
    await user.click(followUpButtons[1]);

    expect(
      screen.getByRole("region", {
        name: withHistoryInstance(
          "Follow-up chat for generator report Founders × SaaS",
          RUN_A,
        ),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", {
        name: withHistoryInstance(
          "Follow-up chat for generator report Founders × SaaS",
          RUN_B,
        ),
      }),
    ).toBeInTheDocument();

    const panel = screen.getByRole("tabpanel");
    expect(await axe(panel)).toHaveNoViolations();
  });
});
