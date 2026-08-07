import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { axe } from "@/test/axe";

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
  },
}));
vi.mock("@/lib/analytics", async () => {
  const actual = await vi.importActual<typeof import("@/lib/analytics")>(
    "@/lib/analytics",
  );
  return { ...actual, track: vi.fn() };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/FollowUpChat", () => ({
  FollowUpChat: () => null,
}));
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

describe("Reports History tabs accessibility", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    getMyBacklogMock.mockResolvedValue([]);
    getMyGeneratorRunsMock.mockResolvedValue([
      {
        id: "run-1",
        created_at: "2026-08-06T12:00:00.000Z",
        persona: "Founders",
        category: "SaaS",
        idea_suggestions: [
          { name: "SQL Buddy", description: "Helps write SQL", demandScore: 80 },
        ],
        problem_clusters: [],
      },
    ]);
    getMyValidationReportsMock.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  async function renderHistory() {
    render(
      <MemoryRouter initialEntries={["/history"]}>
        <Reports />
      </MemoryRouter>,
    );
    await screen.findByRole("tab", { name: /research/i });
  }

  it("exposes a tablist with one tab stop and linked tabpanels", async () => {
    const user = userEvent.setup();
    await renderHistory();

    const tablist = screen.getByRole("tablist", { name: /history sections/i });
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs).toHaveLength(2);

    const research = screen.getByRole("tab", { name: /research/i });
    const chats = screen.getByRole("tab", { name: /orbis ai chats/i });
    expect(research).toHaveAttribute("aria-selected", "true");
    expect(research).toHaveAttribute("tabIndex", "0");
    expect(chats).toHaveAttribute("aria-selected", "false");
    expect(chats).toHaveAttribute("tabIndex", "-1");

    const researchPanelId = research.getAttribute("aria-controls");
    expect(researchPanelId).toBeTruthy();
    const researchPanel = document.getElementById(researchPanelId!);
    expect(researchPanel).toHaveAttribute("role", "tabpanel");
    expect(researchPanel).toHaveAttribute("aria-labelledby", research.id);

    expect(await axe(tablist)).toHaveNoViolations();
    expect(await axe(researchPanel!)).toHaveNoViolations();

    research.focus();
    await user.keyboard("{ArrowRight}");
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /orbis ai chats/i })).toHaveFocus();
    });
    const chatsTab = screen.getByRole("tab", { name: /orbis ai chats/i });
    expect(chatsTab).toHaveAttribute("aria-selected", "true");
    expect(chatsTab).toHaveAttribute("tabIndex", "0");
    expect(screen.getByRole("tab", { name: /research/i })).toHaveAttribute(
      "tabIndex",
      "-1",
    );

    const chatsPanelId = chatsTab.getAttribute("aria-controls");
    const chatsPanel = document.getElementById(chatsPanelId!);
    expect(chatsPanel).toHaveAttribute("role", "tabpanel");
    expect(chatsPanel).toHaveAttribute("aria-labelledby", chatsTab.id);
    expect(await axe(chatsPanel!)).toHaveNoViolations();

    await user.keyboard("{ArrowLeft}");
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /research/i })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    await user.keyboard("{End}");
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /orbis ai chats/i })).toHaveFocus();
    });
    await user.keyboard("{Home}");
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /research/i })).toHaveFocus();
    });
  });

  it("still activates tabs by click", async () => {
    const user = userEvent.setup();
    await renderHistory();
    await user.click(screen.getByRole("tab", { name: /orbis ai chats/i }));
    expect(screen.getByRole("tab", { name: /orbis ai chats/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText(/no chats yet/i)).toBeInTheDocument();
  });
});
