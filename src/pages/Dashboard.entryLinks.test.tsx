import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import type { DashboardOverview } from "@/lib/dashboardOverview";

const getDashboardOverviewMock = vi.fn();
const useAuthMock = vi.fn();
const useCreditsMock = vi.fn();

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
vi.mock("@/lib/dashboardOverview", async () => {
  const actual = await vi.importActual<typeof import("@/lib/dashboardOverview")>(
    "@/lib/dashboardOverview",
  );
  return {
    ...actual,
    getDashboardOverview: (...args: unknown[]) => getDashboardOverviewMock(...args),
  };
});

import Dashboard from "./Dashboard";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-path">{location.pathname}</div>;
}

function renderAt(path = "/dashboard") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <>
              <Dashboard />
              <LocationProbe />
            </>
          }
        />
        <Route path="/generate" element={<LocationProbe />} />
        <Route path="/validate" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

const mixedOverview: DashboardOverview = {
  recentActivity: [
    {
      kind: "generator",
      id: "g-new",
      createdAt: "2026-08-06T12:00:00.000Z",
      title: "SQL Prompt Buddy",
      contextLabel: "Data teams · Developer tools · 1 idea",
      ideaCount: 1,
      topIdea: { name: "SQL Prompt Buddy", description: "Helps write SQL" },
    },
  ],
  stats: { ideasGenerated: 1, ideasValidated: 0, ideasInBacklog: 0 },
};

describe("Dashboard entry card links", () => {
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

  it("first-run cards are links that navigate with Enter", async () => {
    const user = userEvent.setup();
    getDashboardOverviewMock.mockResolvedValue({
      recentActivity: [],
      stats: { ideasGenerated: 0, ideasValidated: 0, ideasInBacklog: 0 },
    });
    renderAt();
    await screen.findByText(/start your first research/i);

    const generate = screen.getByRole("link", { name: /find product ideas/i });
    const validate = screen.getByRole("link", { name: /validate an idea/i });
    expect(generate).toHaveAttribute("href", "/generate");
    expect(validate).toHaveAttribute("href", "/validate");
    expect(screen.getByRole("heading", { level: 3, name: /find product ideas/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: /validate an idea/i })).toBeInTheDocument();

    generate.focus();
    expect(generate).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(await screen.findByTestId("location-path")).toHaveTextContent("/generate");
  });

  it("returning-user cards are tabbable links that navigate with Enter", async () => {
    const user = userEvent.setup();
    getDashboardOverviewMock.mockResolvedValue(mixedOverview);
    renderAt();
    await screen.findByText(/start something new/i);

    const generate = screen.getByRole("link", { name: /find ideas to build/i });
    const validate = screen.getByRole("link", { name: /validate my idea/i });
    expect(generate).toHaveAttribute("href", "/generate");
    expect(validate).toHaveAttribute("href", "/validate");
    expect(screen.getByRole("heading", { level: 3, name: /find ideas to build/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: /validate my idea/i })).toBeInTheDocument();

    let focused: HTMLElement | null = null;
    for (let i = 0; i < 40; i += 1) {
      await user.tab();
      const active = document.activeElement as HTMLElement | null;
      if (active === generate || active === validate) {
        focused = active;
        break;
      }
    }
    expect(focused).not.toBeNull();
    expect(focused).toHaveFocus();
    const target = focused === validate ? "/validate" : "/generate";
    await user.keyboard("{Enter}");
    expect(await screen.findByTestId("location-path")).toHaveTextContent(target);
  });
});
