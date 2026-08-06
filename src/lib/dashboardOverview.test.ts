import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  combineRecentActivity,
  computeValidationOverallScore,
  DashboardOverviewError,
  EMPTY_DASHBOARD_OVERVIEW,
  getDashboardOverview,
  normalizeGeneratorActivity,
  normalizeValidationActivity,
  parseIdeaSuggestions,
  parseValidationScores,
} from "./dashboardOverview";

const getUserMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: (...args: unknown[]) => getUserMock(...args) },
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

function chainResult(result: {
  data?: unknown;
  error?: unknown;
  count?: number | null;
}) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.select = vi.fn(self);
  chain.eq = vi.fn(self);
  chain.order = vi.fn(self);
  chain.limit = vi.fn(self);
  // Thenable so await works
  chain.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(result).then(resolve);
  return chain;
}

describe("dashboard overview normalization", () => {
  it("parses idea suggestions and skips invalid names", () => {
    expect(
      parseIdeaSuggestions([
        { name: "  SQL Prompt Buddy ", description: " Helps " },
        { name: "" },
        { name: "   " },
        null,
        "x",
        { name: "Second" },
      ]),
    ).toEqual([
      { name: "SQL Prompt Buddy", description: "Helps" },
      { name: "Second" },
    ]);
  });

  it("treats malformed idea_suggestions as empty", () => {
    expect(parseIdeaSuggestions(null)).toEqual([]);
    expect(parseIdeaSuggestions({})).toEqual([]);
    expect(parseIdeaSuggestions("oops")).toEqual([]);
  });

  it("normalizes generator title from first valid idea", () => {
    const item = normalizeGeneratorActivity({
      id: "g1",
      created_at: "2026-08-01T10:00:00.000Z",
      persona: "Data teams",
      category: "Developer tools",
      idea_suggestions: [
        { name: "" },
        { name: "SQL Prompt Buddy", description: "desc" },
      ],
    });
    expect(item.kind).toBe("generator");
    if (item.kind !== "generator") return;
    expect(item.title).toBe("SQL Prompt Buddy");
    expect(item.topIdea).toEqual({ name: "SQL Prompt Buddy", description: "desc" });
    expect(item.ideaCount).toBe(1);
    expect(item.contextLabel).toContain("Data teams");
  });

  it("falls back to persona × category then Idea discovery", () => {
    expect(
      normalizeGeneratorActivity({
        id: "g2",
        created_at: "2026-08-01T10:00:00.000Z",
        persona: "Founders",
        category: "SaaS",
        idea_suggestions: [],
      }).title,
    ).toBe("Founders × SaaS");

    expect(
      normalizeGeneratorActivity({
        id: "g3",
        created_at: "2026-08-01T10:00:00.000Z",
        persona: "",
        category: "",
        idea_suggestions: "bad",
      }).title,
    ).toBe("Idea discovery");
  });

  it("normalizes validation title and handles missing scores", () => {
    const withScores = normalizeValidationActivity({
      id: "v1",
      created_at: "2026-08-01T11:00:00.000Z",
      idea_text: "  Trip planner  ",
      verdict: "Build",
      scores: { demand: 80, pain: 70, competition: 40, mvpFeasibility: 60 },
    });
    expect(withScores.kind).toBe("validation");
    if (withScores.kind !== "validation") return;
    expect(withScores.title).toBe("Trip planner");
    expect(withScores.overallScore).toBe(
      computeValidationOverallScore({
        demand: 80,
        pain: 70,
        competition: 40,
        mvpFeasibility: 60,
      }),
    );

    const missing = normalizeValidationActivity({
      id: "v2",
      created_at: "2026-08-01T11:00:00.000Z",
      idea_text: "   ",
      verdict: null,
      scores: { demand: "x" },
    });
    expect(missing.kind).toBe("validation");
    if (missing.kind !== "validation") return;
    expect(missing.title).toBe("Validation report");
    expect(missing.overallScore).toBeNull();
    expect(parseValidationScores(null)).toBeNull();
  });

  it("combines and sorts newest first, keeping only limit", () => {
    const generators = [
      normalizeGeneratorActivity({
        id: "g-old",
        created_at: "2026-08-01T08:00:00.000Z",
        persona: "A",
        category: "B",
        idea_suggestions: [{ name: "Old Gen" }],
      }),
      normalizeGeneratorActivity({
        id: "g-new",
        created_at: "2026-08-01T12:00:00.000Z",
        persona: "A",
        category: "B",
        idea_suggestions: [{ name: "New Gen" }],
      }),
    ];
    const validations = [
      normalizeValidationActivity({
        id: "v-mid",
        created_at: "2026-08-01T10:00:00.000Z",
        idea_text: "Mid Val",
        verdict: "Pivot",
        scores: null,
      }),
      normalizeValidationActivity({
        id: "v-newer",
        created_at: "2026-08-01T13:00:00.000Z",
        idea_text: "Newest Val",
        verdict: "Build",
        scores: null,
      }),
    ];
    const recent = combineRecentActivity(generators, validations, 3);
    expect(recent.map((r) => r.id)).toEqual(["v-newer", "g-new", "v-mid"]);
    expect(recent).toHaveLength(3);
  });

  it("does not always favor one record type", () => {
    const generators = [
      normalizeGeneratorActivity({
        id: "g1",
        created_at: "2026-08-01T15:00:00.000Z",
        persona: "A",
        category: "B",
        idea_suggestions: [{ name: "G" }],
      }),
    ];
    const validations = [
      normalizeValidationActivity({
        id: "v1",
        created_at: "2026-08-01T14:00:00.000Z",
        idea_text: "V",
        verdict: "Skip",
        scores: null,
      }),
    ];
    expect(combineRecentActivity(generators, validations, 2).map((r) => r.kind)).toEqual([
      "generator",
      "validation",
    ]);
  });
});

describe("getDashboardOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty overview when no user", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    await expect(getDashboardOverview()).resolves.toEqual(EMPTY_DASHBOARD_OVERVIEW);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("scopes queries by user id and checks errors", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-a" } },
      error: null,
    });

    const eqCalls: string[] = [];
    fromMock.mockImplementation((table: string) => {
      const result =
        table === "backlog_items" || table === "validation_reports"
          ? { data: [], error: null, count: 0 }
          : { data: [], error: null };
      const chain = chainResult(result);
      (chain.eq as ReturnType<typeof vi.fn>).mockImplementation(
        (col: string, val: string) => {
          eqCalls.push(`${table}:${col}:${val}`);
          return chain;
        },
      );
      // For generator recent vs ideas: distinguish by whether limit is used later
      return chain;
    });

    // Simpler: mock from to return success for all
    fromMock.mockImplementation(() =>
      chainResult({ data: [], error: null, count: 0 }),
    );

    await getDashboardOverview(3);
    expect(fromMock).toHaveBeenCalled();
    // Every chain used eq with user id — verify via spy on last chains
    const eqSpies = fromMock.mock.results.map(
      (r) => (r.value as { eq: ReturnType<typeof vi.fn> }).eq,
    );
    for (const eq of eqSpies) {
      expect(eq).toHaveBeenCalledWith("user_id", "user-a");
    }
  });

  it("throws typed failure without exposing raw messages", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-a" } },
      error: null,
    });
    fromMock.mockImplementation(() =>
      chainResult({ data: null, error: { message: "permission denied xyz" } }),
    );
    await expect(getDashboardOverview()).rejects.toBeInstanceOf(
      DashboardOverviewError,
    );
    await expect(getDashboardOverview()).rejects.toThrow(
      "We couldn't load your dashboard.",
    );
  });

  it("computes stats from idea suggestion counts and counts", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-a" } },
      error: null,
    });

    let generatorSelectCalls = 0;
    fromMock.mockImplementation((table: string) => {
      if (table === "generator_runs") {
        generatorSelectCalls += 1;
        if (generatorSelectCalls === 1) {
          return chainResult({
            data: [
              {
                id: "g1",
                created_at: "2026-08-01T12:00:00.000Z",
                persona: "P",
                category: "C",
                idea_suggestions: [{ name: "One" }, { name: "Two" }],
              },
            ],
            error: null,
          });
        }
        return chainResult({
          data: [
            { idea_suggestions: [{ name: "One" }, { name: "Two" }] },
            { idea_suggestions: [{ name: "Three" }] },
          ],
          error: null,
        });
      }
      if (table === "validation_reports") {
        return chainResult({
          data: [
            {
              id: "v1",
              created_at: "2026-08-01T11:00:00.000Z",
              idea_text: "Idea",
              verdict: "Build",
              scores: null,
            },
          ],
          error: null,
          count: 4,
        });
      }
      if (table === "backlog_items") {
        return chainResult({ data: null, error: null, count: 7 });
      }
      return chainResult({ data: [], error: null, count: 0 });
    });

    const overview = await getDashboardOverview(3);
    expect(overview.stats).toEqual({
      ideasGenerated: 3,
      ideasValidated: 4,
      ideasInBacklog: 7,
    });
    expect(overview.recentActivity).toHaveLength(2);
  });
});
