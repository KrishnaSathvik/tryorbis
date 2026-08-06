import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { DashboardOverview } from "@/lib/dashboardOverview";

const navigateMock = vi.fn();
const getDashboardOverviewMock = vi.fn();
const useAuthMock = vi.fn();
const useCreditsMock = vi.fn();
const trackMock = vi.fn();

vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: () => {} }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));
vi.mock("@/hooks/useCredits", () => ({
  useCredits: () => useCreditsMock(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ insert: vi.fn() }) },
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
vi.mock("@/lib/dashboardOverview", async () => {
  const actual = await vi.importActual<typeof import("@/lib/dashboardOverview")>(
    "@/lib/dashboardOverview",
  );
  return {
    ...actual,
    getDashboardOverview: (...args: unknown[]) => getDashboardOverviewMock(...args),
  };
});
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

import Dashboard from "./Dashboard";

const mixedOverview: DashboardOverview = {
  recentActivity: [
    {
      kind: "generator",
      id: "g-new",
      createdAt: "2026-08-06T12:00:00.000Z",
      title: "SQL Prompt Buddy",
      contextLabel: "Data teams · Developer tools · 2 ideas",
      ideaCount: 2,
      topIdea: { name: "SQL Prompt Buddy", description: "Helps write SQL" },
    },
    {
      kind: "validation",
      id: "v-mid",
      createdAt: "2026-08-06T11:00:00.000Z",
      title: "Grocery aisle sorter",
      verdict: "Pivot",
      overallScore: 42,
    },
    {
      kind: "generator",
      id: "g-old",
      createdAt: "2026-08-06T10:00:00.000Z",
      title: "Founders × SaaS",
      contextLabel: "Founders · SaaS · 0 ideas",
      ideaCount: 0,
      topIdea: null,
    },
  ],
  stats: {
    ideasGenerated: 5,
    ideasValidated: 2,
    ideasInBacklog: 1,
  },
};

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
}

describe("Dashboard resume", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({
      user: { id: "user-a" },
      profile: { display_name: "Alex" },
    });
    useCreditsMock.mockReturnValue({
      remaining: 2,
      loading: false,
      unavailable: false,
    });
  });

  it("shows skeletons while loading and does not flash first-run", async () => {
    let resolveOverview: (v: DashboardOverview) => void = () => {};
    getDashboardOverviewMock.mockReturnValue(
      new Promise<DashboardOverview>((resolve) => {
        resolveOverview = resolve;
      }),
    );
    renderDashboard();
    expect(screen.getByLabelText(/loading recent research/i)).toBeInTheDocument();
    expect(screen.queryByText(/start your first research/i)).not.toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    resolveOverview(mixedOverview);
    await screen.findByText(/pick up where you left off/i);
  });

  it("shows returning-user recent work with recommended next on newest only", async () => {
    getDashboardOverviewMock.mockResolvedValue(mixedOverview);
    renderDashboard();
    expect(await screen.findByText(/pick up where you left off/i)).toBeInTheDocument();
    expect(screen.getByText("SQL Prompt Buddy")).toBeInTheDocument();
    expect(screen.getByText("Grocery aisle sorter")).toBeInTheDocument();
    expect(screen.getByText("Founders × SaaS")).toBeInTheDocument();
    expect(screen.getAllByText(/^idea discovery$/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/^validation$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/recommended next/i)).toHaveLength(1);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(/start something new/i)).toBeInTheDocument();
  });

  it("navigates Validate this idea with prefill and View research fallback", async () => {
    const user = userEvent.setup();
    getDashboardOverviewMock.mockResolvedValue(mixedOverview);
    renderDashboard();
    await screen.findByText(/pick up where you left off/i);

    await user.click(screen.getByRole("button", { name: /validate this idea: sql prompt buddy/i }));
    expect(navigateMock).toHaveBeenCalledWith("/validate", {
      state: {
        dashboardValidatePrefill: {
          text: "SQL Prompt Buddy: Helps write SQL",
          sourceRunId: "g-new",
          sourceIdeaName: "SQL Prompt Buddy",
        },
      },
    });

    await user.click(screen.getByRole("button", { name: /view research: founders × saas/i }));
    expect(navigateMock).toHaveBeenCalledWith(
      "/history?item=generator%3Ag-old",
      undefined,
    );
  });

  it("shows Continue for newest validation with accessible name", async () => {
    const user = userEvent.setup();
    getDashboardOverviewMock.mockResolvedValue({
      recentActivity: [
        {
          kind: "validation",
          id: "v1",
          createdAt: "2026-08-06T12:00:00.000Z",
          title: "Park planner",
          verdict: "Build",
          overallScore: 55,
        },
      ],
      stats: { ideasGenerated: 0, ideasValidated: 1, ideasInBacklog: 0 },
    });
    renderDashboard();
    await screen.findByText(/recommended next/i);
    await user.click(screen.getByRole("button", { name: /continue reviewing: park planner/i }));
    expect(navigateMock).toHaveBeenCalledWith(
      "/history?item=validation%3Av1",
      undefined,
    );
  });

  it("shows first-run experience when empty", async () => {
    getDashboardOverviewMock.mockResolvedValue({
      recentActivity: [],
      stats: { ideasGenerated: 0, ideasValidated: 0, ideasInBacklog: 0 },
    });
    renderDashboard();
    expect(await screen.findByText(/start your first research/i)).toBeInTheDocument();
    expect(screen.queryByText(/pick up where you left off/i)).not.toBeInTheDocument();
    expect(screen.getByText(/find product ideas/i)).toBeInTheDocument();
    expect(screen.getByText(/validate an idea/i)).toBeInTheDocument();
  });

  it("shows safe error without false zeros and retries", async () => {
    const user = userEvent.setup();
    getDashboardOverviewMock
      .mockRejectedValueOnce(new Error("secret db fail"))
      .mockResolvedValueOnce(mixedOverview);
    renderDashboard();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /we couldn't load your dashboard/i,
    );
    expect(screen.queryByText("secret db fail")).not.toBeInTheDocument();
    expect(screen.queryByText("Ideas Generated")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByText(/pick up where you left off/i)).toBeInTheDocument();
    expect(getDashboardOverviewMock).toHaveBeenCalledTimes(2);
  });

  it("clears prior activity on user switch and ignores stale responses", async () => {
    let resolveA: (v: DashboardOverview) => void = () => {};
    getDashboardOverviewMock.mockImplementationOnce(
      () =>
        new Promise<DashboardOverview>((resolve) => {
          resolveA = resolve;
        }),
    );
    const { rerender } = renderDashboard();
    expect(screen.getByLabelText(/loading recent research/i)).toBeInTheDocument();

    useAuthMock.mockReturnValue({
      user: { id: "user-b" },
      profile: { display_name: "Blake" },
    });
    getDashboardOverviewMock.mockResolvedValueOnce({
      recentActivity: [],
      stats: { ideasGenerated: 0, ideasValidated: 0, ideasInBacklog: 0 },
    });
    rerender(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    await screen.findByText(/start your first research/i);

    // Stale user-A response must not overwrite user-B empty state
    resolveA(mixedOverview);
    await waitFor(() => {
      expect(screen.queryByText("SQL Prompt Buddy")).not.toBeInTheDocument();
    });
    expect(screen.getByText(/start your first research/i)).toBeInTheDocument();
  });

  it("keeps post-quota panel compatible with recent activity", async () => {
    useCreditsMock.mockReturnValue({
      remaining: 0,
      loading: false,
      unavailable: false,
    });
    getDashboardOverviewMock.mockResolvedValue(mixedOverview);
    renderDashboard();
    expect(await screen.findByTestId("post-quota-continuation-panel")).toBeInTheDocument();
    expect(screen.getByText(/pick up where you left off/i)).toBeInTheDocument();
  });

  it("emits report_opened_from_dashboard for History-opening actions", async () => {
    const user = userEvent.setup();
    getDashboardOverviewMock.mockResolvedValue(mixedOverview);
    renderDashboard();
    await screen.findByText(/pick up where you left off/i);
    trackMock.mockClear();
    await user.click(screen.getByRole("button", { name: /view research: founders × saas/i }));
    expect(trackMock).toHaveBeenCalledWith("report_opened_from_dashboard");
    expect(trackMock).toHaveBeenCalledTimes(1);
  });

  it("does not emit report_opened_from_dashboard for Validate this idea", async () => {
    const user = userEvent.setup();
    getDashboardOverviewMock.mockResolvedValue(mixedOverview);
    renderDashboard();
    await screen.findByText(/pick up where you left off/i);
    trackMock.mockClear();
    await user.click(screen.getByRole("button", { name: /validate this idea: sql prompt buddy/i }));
    expect(trackMock).not.toHaveBeenCalled();
  });
});
