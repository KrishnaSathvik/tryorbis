import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const invokeMock = vi.fn();
const useCreditsMock = vi.fn();
const refreshCreditsMock = vi.fn();
const addToBacklogDbMock = vi.fn();
const saveValidationReportDbMock = vi.fn();
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
  saveValidationReportDb: (...args: unknown[]) =>
    saveValidationReportDbMock(...args),
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
vi.mock("@/components/FollowUpChat", () => ({ FollowUpChat: () => null }));
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
vi.mock("@/components/VerdictBadge", () => ({ VerdictBadge: () => null }));
vi.mock("@/components/ValidationScorecard", () => ({
  ValidationScorecard: () => null,
}));
vi.mock("@/components/AIHandoff", () => ({ AIHandoff: () => null }));
vi.mock("@/components/VoiceButton", () => ({ VoiceButton: () => null }));

import ValidateIdea from "./ValidateIdea";

Element.prototype.scrollIntoView = vi.fn();

function buildReport(verdict: "Build" | "Pivot" | "Skip") {
  return {
    scores: { demand: 70, pain: 60, competition: 40, mvpFeasibility: 50 },
    verdict,
    pros: ["a"],
    cons: ["b"],
    gapOpportunities: ["c"],
    mvpWedge: "wedge",
    killTest: "kill",
    competitors: [],
    evidenceLinks: [],
  };
}

async function reachResults(verdict: "Build" | "Pivot" | "Skip") {
  invokeMock
    .mockResolvedValueOnce({
      data: {
        reply: "Ready",
        ready: true,
        params: { ideaText: "Park planner app" },
      },
      error: null,
    })
    .mockResolvedValueOnce({ data: buildReport(verdict), error: null });

  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <ValidateIdea />
    </MemoryRouter>,
  );
  await user.type(
    screen.getByPlaceholderText(/e\.g\. AI tool that tracks subscriptions/i),
    "Park planner",
  );
  await user.keyboard("{Enter}");
  await screen.findByRole("button", { name: /start validation/i });
  await user.click(screen.getByRole("button", { name: /start validation/i }));
  await screen.findByRole("heading", { name: /recommended next step/i });
  return user;
}

describe("ValidateIdea NextStepCard", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    invokeMock.mockReset();
    refreshCreditsMock.mockResolvedValue(undefined);
    saveValidationReportDbMock.mockResolvedValue(undefined);
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

  it("shows Build primary save label", async () => {
    await reachResults("Build");
    expect(
      screen.getByRole("button", { name: /save this idea/i }),
    ).toBeInTheDocument();
  });

  it("shows Pivot primary ask-to-refine label", async () => {
    await reachResults("Pivot");
    expect(
      screen.getByRole("button", { name: /ask orbis to refine it/i }),
    ).toBeInTheDocument();
  });

  it("shows Skip primary stronger-direction label", async () => {
    await reachResults("Skip");
    expect(
      screen.getByRole("button", { name: /ask orbis for a stronger direction/i }),
    ).toBeInTheDocument();
  });
});
