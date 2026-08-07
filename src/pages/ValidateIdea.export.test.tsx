import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { axe } from "@/test/axe";
import { toast } from "sonner";

const invokeMock = vi.fn();
const useCreditsMock = vi.fn();
const refreshCreditsMock = vi.fn();
const addToBacklogDbMock = vi.fn();
const saveValidationReportDbMock = vi.fn();
const getMyBacklogMock = vi.fn();
const trackMock = vi.fn();
const downloadMarkdownFileMock = vi.fn();

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
vi.mock("@/lib/downloadMarkdown", () => ({
  downloadMarkdownFile: (...args: unknown[]) =>
    downloadMarkdownFileMock(...args),
}));
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

function buildReport() {
  return {
    scores: { demand: 70, pain: 60, competition: 40, mvpFeasibility: 50 },
    verdict: "Build" as const,
    pros: ["a"],
    cons: ["b"],
    gapOpportunities: ["c"],
    mvpWedge: "wedge",
    killTest: "kill",
    competitors: [],
    evidenceLinks: ["https://example.com/evidence"],
    wtpSignals: {
      strength: "strong" as const,
      summary: "Users already pay for planning help.",
      priceRange: { low: 9, mid: 19, high: 39, currency: "USD" },
      signals: [],
    },
  };
}

async function reachResults() {
  invokeMock
    .mockResolvedValueOnce({
      data: {
        reply: "Ready",
        ready: true,
        params: { ideaText: "Park planner app" },
      },
      error: null,
    })
    .mockResolvedValueOnce({ data: buildReport(), error: null });

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

describe("ValidateIdea Markdown export", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    invokeMock.mockReset();
    downloadMarkdownFileMock.mockReset();
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

  it("hides Export Markdown before a completed result", () => {
    render(
      <MemoryRouter>
        <ValidateIdea />
      </MemoryRouter>,
    );
    expect(
      screen.queryByRole("button", { name: /export markdown/i }),
    ).not.toBeInTheDocument();
  });

  it("exports Markdown from a completed result with analytics and axe-clean control", async () => {
    const user = await reachResults();
    const exportButton = screen.getByRole("button", { name: /export markdown/i });
    expect(exportButton).toBeInTheDocument();

    exportButton.focus();
    expect(exportButton).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(downloadMarkdownFileMock).toHaveBeenCalledTimes(1);
    const [markdown, filename] = downloadMarkdownFileMock.mock.calls[0] as [
      string,
      string,
    ];
    expect(markdown).toContain("# Orbis Validation Report");
    expect(markdown).toContain("## Idea");
    expect(markdown).toContain("## Verdict");
    expect(markdown).toContain("## Scorecard");
    expect(markdown).toContain("## Willingness to Pay");
    expect(filename).toMatch(/\.md$/);

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

    expect(await axe(exportButton)).toHaveNoViolations();
  });

  it("shows an error toast and skips analytics when download fails", async () => {
    downloadMarkdownFileMock.mockImplementation(() => {
      throw new Error("boom");
    });
    const user = await reachResults();
    const exportButton = screen.getByRole("button", { name: /export markdown/i });
    await user.click(exportButton);

    expect(trackMock).not.toHaveBeenCalledWith(
      "export_markdown",
      expect.anything(),
    );
    expect(toast.error).toHaveBeenCalledWith("Couldn’t export this report");
    expect(exportButton).toBeEnabled();
  });
});
