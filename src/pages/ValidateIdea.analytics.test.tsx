import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const invokeMock = vi.fn();
const useCreditsMock = vi.fn();
const refreshCreditsMock = vi.fn();
const addToBacklogDbMock = vi.fn();
const saveValidationReportDbMock = vi.fn();
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
  saveValidationReportDb: (...args: unknown[]) => saveValidationReportDbMock(...args),
  addToBacklogDb: (...args: unknown[]) => addToBacklogDbMock(...args),
  getMyBacklog: vi.fn().mockResolvedValue([]),
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
  ResearchModeToggle: ({
    mode,
    onChange,
  }: {
    mode: string;
    onChange: (m: "regular" | "deep") => void;
  }) => (
    <button type="button" onClick={() => onChange(mode === "regular" ? "deep" : "regular")}>
      Toggle mode ({mode})
    </button>
  ),
}));
vi.mock("@/components/UpgradeModal", () => ({
  UpgradeModal: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">upgrade</div> : null,
}));
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
vi.mock("@/components/AIHandoff", () => ({ AIHandoff: () => null }));
vi.mock("@/components/VoiceButton", () => ({ VoiceButton: () => null }));
vi.mock("@/components/ValidationScorecard", () => ({
  ValidationScorecard: () => null,
}));
vi.mock("@/components/VerdictBadge", () => ({ VerdictBadge: () => null }));

import ValidateIdea from "./ValidateIdea";

Element.prototype.scrollIntoView = vi.fn();

const regularReport = {
  scores: { demand: 8, pain: 7, competition: 3, mvpFeasibility: 8 },
  verdict: "Build",
  pros: ["a"],
  cons: ["b"],
  gapOpportunities: [],
  mvpWedge: "wedge",
  killTest: "kill",
  competitors: [],
  evidenceLinks: [],
};

async function readyForValidation() {
  invokeMock.mockResolvedValueOnce({
    data: {
      reply: "Ready",
      ready: true,
      params: { ideaText: "An AI meal planner" },
    },
    error: null,
  });
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <ValidateIdea />
    </MemoryRouter>,
  );
  const input = screen.getByRole("textbox");
  await user.type(input, "meal planner idea");
  await user.keyboard("{Enter}");
  await screen.findByRole("button", { name: /start validation/i });
  return user;
}

describe("ValidateIdea analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refreshCreditsMock.mockResolvedValue(undefined);
    saveValidationReportDbMock.mockResolvedValue(undefined);
    addToBacklogDbMock.mockResolvedValue(undefined);
    useCreditsMock.mockReturnValue({
      hasCredits: true,
      remaining: 1,
      refreshCredits: refreshCreditsMock,
      loading: false,
      unavailable: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not emit on starter selection", async () => {
    const user = userEvent.setup();
    invokeMock.mockResolvedValue({ data: { reply: "ok", ready: false }, error: null });
    render(
      <MemoryRouter>
        <ValidateIdea />
      </MemoryRouter>,
    );
    const starters = screen.queryByRole("group", { name: /validate/i });
    if (starters) {
      const chip = screen.getAllByRole("button")[0];
      await user.click(chip);
    }
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("does not emit when unavailable", async () => {
    useCreditsMock.mockReturnValue({
      hasCredits: false,
      remaining: null,
      refreshCredits: refreshCreditsMock,
      loading: false,
      unavailable: true,
    });
    const user = await readyForValidation();
    trackMock.mockClear();
    await user.click(screen.getByRole("button", { name: /start validation/i }));
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("emits quota_hit at confirmed zero", async () => {
    useCreditsMock.mockReturnValue({
      hasCredits: false,
      remaining: 0,
      refreshCredits: refreshCreditsMock,
      loading: false,
      unavailable: false,
    });
    const user = await readyForValidation();
    trackMock.mockClear();
    await user.click(screen.getByRole("button", { name: /start validation/i }));
    expect(trackMock).toHaveBeenCalledWith("quota_hit", { surface: "validate" });
    expect(
      trackMock.mock.calls.filter((c) => c[0] === "research_started"),
    ).toHaveLength(0);
  });

  it("does not emit quota_hit when remaining is null", async () => {
    useCreditsMock.mockReturnValue({
      hasCredits: false,
      remaining: null,
      refreshCredits: refreshCreditsMock,
      loading: false,
      unavailable: false,
    });
    const user = await readyForValidation();
    trackMock.mockClear();
    await user.click(screen.getByRole("button", { name: /start validation/i }));
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("does not emit quota_hit when remaining is non-zero even if hasCredits is false", async () => {
    useCreditsMock.mockReturnValue({
      hasCredits: false,
      remaining: 1,
      refreshCredits: refreshCreditsMock,
      loading: false,
      unavailable: false,
    });
    const user = await readyForValidation();
    trackMock.mockClear();
    await user.click(screen.getByRole("button", { name: /start validation/i }));
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("does not emit when credits are loading", async () => {
    useCreditsMock.mockReturnValue({
      hasCredits: false,
      remaining: null,
      refreshCredits: refreshCreditsMock,
      loading: true,
      unavailable: false,
    });
    const user = await readyForValidation();
    trackMock.mockClear();
    await user.click(screen.getByRole("button", { name: /start validation/i }));
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("rejects malformed {} validation with invalid_response and no fake report", async () => {
    const user = await readyForValidation();
    trackMock.mockClear();
    invokeMock.mockResolvedValueOnce({ data: {}, error: null });
    await user.click(screen.getByRole("button", { name: /start validation/i }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith("research_failed", {
        type: "validate",
        code: "invalid_response",
      });
    });
    expect(
      trackMock.mock.calls.filter((c) => c[0] === "research_succeeded"),
    ).toHaveLength(0);
    expect(saveValidationReportDbMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Validation Report")).not.toBeInTheDocument();
    expect(screen.queryByText("Skip")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start validation/i }),
    ).toBeInTheDocument();
  });

  it("rejects missing verdict without defaulting to Skip", async () => {
    const user = await readyForValidation();
    trackMock.mockClear();
    invokeMock.mockResolvedValueOnce({
      data: {
        scores: { demand: 0, pain: 0, competition: 0, mvpFeasibility: 0 },
      },
      error: null,
    });
    await user.click(screen.getByRole("button", { name: /start validation/i }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith("research_failed", {
        type: "validate",
        code: "invalid_response",
      });
    });
    expect(saveValidationReportDbMock).not.toHaveBeenCalled();
  });

  it("rejects malformed deep core without partial zero-score report", async () => {
    const user = await readyForValidation();
    await user.click(screen.getByRole("button", { name: /toggle mode/i }));
    trackMock.mockClear();
    invokeMock.mockResolvedValueOnce({ data: {}, error: null });
    await user.click(screen.getByRole("button", { name: /start validation/i }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith("research_failed", {
        type: "validate",
        code: "invalid_response",
      });
    });
    expect(
      trackMock.mock.calls.filter((c) => c[0] === "research_succeeded"),
    ).toHaveLength(0);
    expect(saveValidationReportDbMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Validation Report")).not.toBeInTheDocument();
  });

  it("rejects malformed deep competitors stage", async () => {
    const user = await readyForValidation();
    await user.click(screen.getByRole("button", { name: /toggle mode/i }));
    trackMock.mockClear();
    invokeMock
      .mockResolvedValueOnce({ data: regularReport, error: null })
      .mockResolvedValueOnce({ data: {}, error: null });
    await user.click(screen.getByRole("button", { name: /start validation/i }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith("research_failed", {
        type: "validate",
        code: "invalid_response",
      });
    });
    expect(
      trackMock.mock.calls.filter((c) => c[0] === "research_succeeded"),
    ).toHaveLength(0);
    expect(saveValidationReportDbMock).not.toHaveBeenCalled();
  });

  it("rejects empty deep intelligence stage", async () => {
    const user = await readyForValidation();
    await user.click(screen.getByRole("button", { name: /toggle mode/i }));
    trackMock.mockClear();
    invokeMock
      .mockResolvedValueOnce({ data: regularReport, error: null })
      .mockResolvedValueOnce({ data: { competitors: [] }, error: null })
      .mockResolvedValueOnce({ data: {}, error: null });
    await user.click(screen.getByRole("button", { name: /start validation/i }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith("research_failed", {
        type: "validate",
        code: "invalid_response",
      });
    });
    expect(
      trackMock.mock.calls.filter((c) => c[0] === "research_succeeded"),
    ).toHaveLength(0);
  });

  it("emits started and succeeded for regular validation", async () => {
    const user = await readyForValidation();
    trackMock.mockClear();
    invokeMock.mockResolvedValueOnce({ data: regularReport, error: null });
    await user.click(screen.getByRole("button", { name: /start validation/i }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith(
        "research_succeeded",
        expect.objectContaining({
          type: "validate",
          mode: "regular",
          duration_ms: expect.any(Number),
        }),
      );
    });
    expect(trackMock).toHaveBeenCalledWith("research_started", {
      type: "validate",
      mode: "regular",
      credits_left: 1,
    });
  });

  it("emits idea_saved from validation_result", async () => {
    const user = await readyForValidation();
    invokeMock.mockResolvedValueOnce({ data: regularReport, error: null });
    await user.click(screen.getByRole("button", { name: /start validation/i }));
    await screen.findByRole("button", { name: /save to my ideas/i });
    trackMock.mockClear();
    await user.click(screen.getByRole("button", { name: /save to my ideas/i }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith("idea_saved", {
        from: "validation_result",
      });
    });
  });
});
