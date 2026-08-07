import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

const invokeMock = vi.fn();
const useCreditsMock = vi.fn();
const refreshCreditsMock = vi.fn();
const addToBacklogDbMock = vi.fn();
const saveGeneratorRunDbMock = vi.fn();
const getMyBacklogMock = vi.fn();
const trackMock = vi.fn();

vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: () => {} }));
vi.mock("@/hooks/useCredits", () => ({
  useCredits: () => useCreditsMock(),
}));
vi.mock("@/hooks/useFocusComposerOnArrive", () => ({
  useFocusComposerOnArrive: () => {},
}));
vi.mock("@/hooks/useDropZone", () => ({
  useDropZone: () => ({ isDragging: false, dropZoneProps: {} }),
}));
vi.mock("@/hooks/useVoiceInput", () => ({
  useVoiceInput: () => ({
    isListening: false,
    isSupported: false,
    startListening: vi.fn(),
    stopListening: vi.fn(),
  }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}));
vi.mock("@/lib/db", () => ({
  saveGeneratorRunDb: (...args: unknown[]) => saveGeneratorRunDbMock(...args),
  addToBacklogDb: (...args: unknown[]) => addToBacklogDbMock(...args),
  getMyBacklog: (...args: unknown[]) => getMyBacklogMock(...args),
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
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/FileUpload", () => ({ FileUpload: () => null }));
vi.mock("@/components/AttachmentPreview", () => ({
  AttachmentPreview: () => null,
}));
vi.mock("@/components/ResearchModeToggle", () => ({
  ResearchModeToggle: () => null,
}));
vi.mock("@/components/UpgradeModal", () => ({ UpgradeModal: () => null }));
vi.mock("@/components/FollowUpChat", () => ({
  FollowUpChat: ({
    prefillRequest,
  }: {
    prefillRequest?: { requestId: number; text: string } | null;
  }) => (
    <div data-testid="follow-up-chat">
      {prefillRequest ? (
        <span data-testid="prefill-text">{prefillRequest.text}</span>
      ) : null}
    </div>
  ),
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
vi.mock("@/components/ResearchTrace", () => ({ ResearchTrace: () => null }));
vi.mock("@/components/ScoreBar", () => ({ ScoreBar: () => null }));
vi.mock("@/components/AIHandoff", () => ({ AIHandoff: () => null }));
vi.mock("@/components/VoiceButton", () => ({ VoiceButton: () => null }));

import GenerateIdeas from "./GenerateIdeas";

Element.prototype.scrollIntoView = vi.fn();

const regularResult = {
  problemClusters: [
    { id: "c1", theme: "t", painSummary: "p", complaintCount: 1, complaints: [] },
  ],
  ideaSuggestions: [
    {
      id: "i1",
      name: "SQL Buddy",
      description: "Helps write SQL",
      demandScore: 90,
      mvpScope: "mvp",
      monetization: "sub",
    },
    {
      id: "i2",
      name: "Other Idea",
      description: "Lower score",
      demandScore: 40,
      mvpScope: "mvp",
      monetization: "sub",
    },
  ],
};

function LocationProbe() {
  const location = useLocation();
  return (
    <div>
      <span data-testid="path">{location.pathname}</span>
      <span data-testid="search">{location.search}</span>
      <span data-testid="state">{JSON.stringify(location.state)}</span>
    </div>
  );
}

async function reachResults() {
  invokeMock
    .mockResolvedValueOnce({
      data: {
        reply: "Ready",
        ready: true,
        params: { persona: "Founders", category: "SaaS" },
      },
      error: null,
    })
    .mockResolvedValueOnce({ data: regularResult, error: null });

  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={["/generate"]}>
      <Routes>
        <Route
          path="/generate"
          element={
            <>
              <GenerateIdeas />
              <LocationProbe />
            </>
          }
        />
        <Route path="/validate" element={<LocationProbe />} />
        <Route path="/ideas" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
  await user.type(
    screen.getByPlaceholderText(/sql prompt buddy/i),
    "build for founders",
  );
  await user.keyboard("{Enter}");
  await screen.findByRole("button", { name: /start research/i });
  await user.click(screen.getByRole("button", { name: /start research/i }));
  await screen.findByRole("heading", { name: /recommended next step/i });
  return user;
}

describe("GenerateIdeas NextStepCard", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    invokeMock.mockReset();
    refreshCreditsMock.mockResolvedValue(undefined);
    saveGeneratorRunDbMock.mockResolvedValue(undefined);
    addToBacklogDbMock.mockResolvedValue(undefined);
    getMyBacklogMock.mockResolvedValue([]);
    useCreditsMock.mockReturnValue({
      hasCredits: true,
      remaining: 2,
      refreshCredits: refreshCreditsMock,
      loading: false,
      unavailable: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("shows card on complete result and validate uses router state not URL", async () => {
    const user = await reachResults();
    expect(
      screen.getByRole("button", { name: /validate “sql buddy”/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /validate “sql buddy”/i }));
    await waitFor(() => {
      expect(screen.getByTestId("path").textContent).toBe("/validate");
    });
    expect(screen.getByTestId("search").textContent).toBe("");
    const state = JSON.parse(screen.getByTestId("state").textContent || "null");
    expect(state.validatePrefill).toEqual({
      source: "generate_result",
      text: "SQL Buddy: Helps write SQL",
      sourceIdeaName: "SQL Buddy",
    });
  });

  it("ask Orbis prefills FollowUpChat", async () => {
    const user = await reachResults();
    await user.click(screen.getByRole("button", { name: /^ask orbis$/i }));
    await waitFor(() => {
      expect(screen.getByTestId("prefill-text")).toHaveTextContent(
        "What should I validate first for this idea?",
      );
    });
  });

  it("save then shows view saved ideas and navigates with focusSection", async () => {
    const user = await reachResults();
    await user.click(screen.getByRole("button", { name: /^save idea$/i }));
    await waitFor(() => {
      expect(addToBacklogDbMock).toHaveBeenCalled();
    });
    expect(
      await screen.findByRole("button", { name: /view saved ideas/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /view saved ideas/i }));
    await waitFor(() => {
      expect(screen.getByTestId("path").textContent).toBe("/ideas");
    });
    const state = JSON.parse(screen.getByTestId("state").textContent || "null");
    expect(state.focusSection).toBe("my-ideas");
  });
});
