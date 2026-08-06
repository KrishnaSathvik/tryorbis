import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const invokeMock = vi.fn();
const useCreditsMock = vi.fn();
const refreshCreditsMock = vi.fn();
const addToBacklogDbMock = vi.fn();
const saveGeneratorRunDbMock = vi.fn();
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

import GenerateIdeas from "./GenerateIdeas";

Element.prototype.scrollIntoView = vi.fn();

const regularResult = {
  problemClusters: [{ theme: "t", painSummary: "p", complaintCount: 1 }],
  ideaSuggestions: [
    {
      name: "Idea A",
      description: "desc",
      demandScore: 80,
      mvpScope: "mvp",
      monetization: "sub",
    },
  ],
};

async function readyForResearch() {
  invokeMock.mockResolvedValueOnce({
    data: {
      reply: "Ready",
      ready: true,
      params: { persona: "Founders", category: "SaaS" },
    },
    error: null,
  });
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <GenerateIdeas />
    </MemoryRouter>,
  );
  await user.type(
    screen.getByPlaceholderText(/sql prompt buddy/i),
    "build for founders",
  );
  await user.keyboard("{Enter}");
  await screen.findByRole("button", { name: /start research/i });
  return user;
}

describe("GenerateIdeas analytics", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    invokeMock.mockReset();
    refreshCreditsMock.mockResolvedValue(undefined);
    saveGeneratorRunDbMock.mockResolvedValue(undefined);
    addToBacklogDbMock.mockResolvedValue(undefined);
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
    vi.clearAllMocks();
  });

  it("does not emit on starter selection", async () => {
    const user = userEvent.setup();
    invokeMock.mockResolvedValue({ data: { reply: "ok", ready: false }, error: null });
    render(
      <MemoryRouter>
        <GenerateIdeas />
      </MemoryRouter>,
    );
    await user.click(
      screen.getByRole("button", { name: /small business owners/i }),
    );
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
    const user = await readyForResearch();
    trackMock.mockClear();
    await user.click(screen.getByRole("button", { name: /start research/i }));
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("emits quota_hit instead of research_started at confirmed zero", async () => {
    useCreditsMock.mockReturnValue({
      hasCredits: false,
      remaining: 0,
      refreshCredits: refreshCreditsMock,
      loading: false,
      unavailable: false,
    });
    const user = await readyForResearch();
    trackMock.mockClear();
    await user.click(screen.getByRole("button", { name: /start research/i }));
    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("quota_hit", { surface: "generate" });
  });

  it("does not emit quota_hit when remaining is null", async () => {
    useCreditsMock.mockReturnValue({
      hasCredits: false,
      remaining: null,
      refreshCredits: refreshCreditsMock,
      loading: false,
      unavailable: false,
    });
    const user = await readyForResearch();
    trackMock.mockClear();
    await user.click(screen.getByRole("button", { name: /start research/i }));
    expect(trackMock).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not emit quota_hit when remaining is non-zero even if hasCredits is false", async () => {
    useCreditsMock.mockReturnValue({
      hasCredits: false,
      remaining: 1,
      refreshCredits: refreshCreditsMock,
      loading: false,
      unavailable: false,
    });
    const user = await readyForResearch();
    trackMock.mockClear();
    await user.click(screen.getByRole("button", { name: /start research/i }));
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("does not emit when credits are unavailable", async () => {
    useCreditsMock.mockReturnValue({
      hasCredits: false,
      remaining: null,
      refreshCredits: refreshCreditsMock,
      loading: false,
      unavailable: true,
    });
    const user = await readyForResearch();
    trackMock.mockClear();
    await user.click(screen.getByRole("button", { name: /start research/i }));
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("rejects malformed {} responses with invalid_response and no save", async () => {
    const user = await readyForResearch();
    trackMock.mockClear();
    invokeMock.mockResolvedValueOnce({ data: {}, error: null });
    await user.click(screen.getByRole("button", { name: /start research/i }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith("research_failed", {
        type: "generate",
        code: "invalid_response",
      });
    });
    expect(
      trackMock.mock.calls.filter((c) => c[0] === "research_started"),
    ).toHaveLength(1);
    expect(
      trackMock.mock.calls.filter((c) => c[0] === "research_succeeded"),
    ).toHaveLength(0);
    expect(saveGeneratorRunDbMock).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /start research/i }),
    ).toBeInTheDocument();
  });

  it("rejects non-array generate fields as invalid_response", async () => {
    const user = await readyForResearch();
    trackMock.mockClear();
    invokeMock.mockResolvedValueOnce({
      data: { problemClusters: {}, ideaSuggestions: "bad" },
      error: null,
    });
    await user.click(screen.getByRole("button", { name: /start research/i }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith("research_failed", {
        type: "generate",
        code: "invalid_response",
      });
    });
    expect(saveGeneratorRunDbMock).not.toHaveBeenCalled();
  });

  it("treats empty arrays as a successful structurally valid generate response", async () => {
    const user = await readyForResearch();
    trackMock.mockClear();
    invokeMock.mockResolvedValueOnce({
      data: { problemClusters: [], ideaSuggestions: [] },
      error: null,
    });
    await user.click(screen.getByRole("button", { name: /start research/i }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith(
        "research_succeeded",
        expect.objectContaining({ type: "generate", mode: "regular" }),
      );
    });
    expect(
      trackMock.mock.calls.filter((c) => c[0] === "research_failed"),
    ).toHaveLength(0);
  });

  it("rejects malformed deep stage-1 without partial UI or success", async () => {
    const user = await readyForResearch();
    await user.click(screen.getByRole("button", { name: /toggle mode/i }));
    trackMock.mockClear();
    invokeMock.mockResolvedValueOnce({ data: {}, error: null });
    await user.click(screen.getByRole("button", { name: /start research/i }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith("research_failed", {
        type: "generate",
        code: "invalid_response",
      });
    });
    expect(
      trackMock.mock.calls.filter((c) => c[0] === "research_succeeded"),
    ).toHaveLength(0);
    expect(saveGeneratorRunDbMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Research Results")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start research/i }),
    ).toBeInTheDocument();
  });

  it("rejects malformed deep stage-2 after valid stage-1", async () => {
    const user = await readyForResearch();
    await user.click(screen.getByRole("button", { name: /toggle mode/i }));
    trackMock.mockClear();
    invokeMock
      .mockResolvedValueOnce({
        data: { problemClusters: [{ theme: "t", painSummary: "p", complaintCount: 1 }] },
        error: null,
      })
      .mockResolvedValueOnce({ data: {}, error: null });
    await user.click(screen.getByRole("button", { name: /start research/i }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith("research_failed", {
        type: "generate",
        code: "invalid_response",
      });
    });
    expect(
      trackMock.mock.calls.filter((c) => c[0] === "research_succeeded"),
    ).toHaveLength(0);
    expect(saveGeneratorRunDbMock).not.toHaveBeenCalled();
  });

  it("rejects empty deep stage-3 intelligence as invalid_response", async () => {
    const user = await readyForResearch();
    await user.click(screen.getByRole("button", { name: /toggle mode/i }));
    trackMock.mockClear();
    invokeMock
      .mockResolvedValueOnce({
        data: { problemClusters: [{ theme: "t", painSummary: "p", complaintCount: 1 }] },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { ideaSuggestions: regularResult.ideaSuggestions },
        error: null,
      })
      .mockResolvedValueOnce({ data: {}, error: null });
    await user.click(screen.getByRole("button", { name: /start research/i }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith("research_failed", {
        type: "generate",
        code: "invalid_response",
      });
    });
    expect(
      trackMock.mock.calls.filter((c) => c[0] === "research_succeeded"),
    ).toHaveLength(0);
    expect(saveGeneratorRunDbMock).not.toHaveBeenCalled();
  });

  it("emits research_started then research_succeeded for regular success", async () => {
    const user = await readyForResearch();
    trackMock.mockClear();
    invokeMock.mockResolvedValueOnce({ data: regularResult, error: null });
    await user.click(screen.getByRole("button", { name: /start research/i }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith(
        "research_succeeded",
        expect.objectContaining({
          type: "generate",
          mode: "regular",
          duration_ms: expect.any(Number),
        }),
      );
    });
    expect(trackMock).toHaveBeenCalledWith("research_started", {
      type: "generate",
      mode: "regular",
      credits_left: 2,
    });
    expect(
      trackMock.mock.calls.filter((c) => c[0] === "research_started"),
    ).toHaveLength(1);
    expect(
      trackMock.mock.calls.filter((c) => c[0] === "research_succeeded"),
    ).toHaveLength(1);
  });

  it("does not emit success after deep stage-1 partial; emits once at final", async () => {
    const user = await readyForResearch();
    await user.click(screen.getByRole("button", { name: /toggle mode/i }));
    trackMock.mockClear();

    invokeMock
      .mockResolvedValueOnce({
        data: { problemClusters: [{ theme: "t", painSummary: "p", complaintCount: 1 }] },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { ideaSuggestions: regularResult.ideaSuggestions },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { wtpSignals: { summary: "ok" } },
        error: null,
      });

    await user.click(screen.getByRole("button", { name: /start research/i }));

    await waitFor(() => {
      expect(
        trackMock.mock.calls.some((c) => c[0] === "research_succeeded"),
      ).toBe(true);
    });

    const successCalls = trackMock.mock.calls.filter(
      (c) => c[0] === "research_succeeded",
    );
    expect(successCalls).toHaveLength(1);
    expect(successCalls[0][1]).toEqual(
      expect.objectContaining({ type: "generate", mode: "deep" }),
    );
  });

  it("emits research_failed with coarse code and no raw error text", async () => {
    const user = await readyForResearch();
    trackMock.mockClear();
    invokeMock.mockResolvedValueOnce({
      data: null,
      error: { message: "429 rate limit exceeded for user secret@x.com" },
    });
    await user.click(screen.getByRole("button", { name: /start research/i }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith("research_failed", {
        type: "generate",
        code: "rate_limited",
      });
    });
    const payload = JSON.stringify(trackMock.mock.calls);
    expect(payload).not.toMatch(/secret@x\.com|rate limit exceeded for user/i);
  });

  it("retry creates a new research lifecycle", async () => {
    const user = await readyForResearch();
    trackMock.mockClear();
    invokeMock.mockResolvedValueOnce({
      data: null,
      error: { message: "boom" },
    });
    await user.click(screen.getByRole("button", { name: /start research/i }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith(
        "research_failed",
        expect.objectContaining({ type: "generate" }),
      );
    });

    trackMock.mockClear();
    invokeMock.mockResolvedValueOnce({ data: regularResult, error: null });
    await user.click(screen.getByRole("button", { name: /start research/i }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith(
        "research_succeeded",
        expect.objectContaining({ type: "generate" }),
      );
    });
    expect(
      trackMock.mock.calls.filter((c) => c[0] === "research_started"),
    ).toHaveLength(1);
  });

  it("emits idea_saved from generator_result without content fields", async () => {
    const user = await readyForResearch();
    invokeMock.mockResolvedValueOnce({ data: regularResult, error: null });
    await user.click(screen.getByRole("button", { name: /start research/i }));
    await screen.findByText("Idea A");
    trackMock.mockClear();
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith("idea_saved", {
        from: "generator_result",
      });
    });
    const props = trackMock.mock.calls.find((c) => c[0] === "idea_saved")?.[1] as Record<
      string,
      unknown
    >;
    expect(Object.keys(props)).toEqual(["from"]);
  });

  it("does not emit idea_saved when save fails", async () => {
    addToBacklogDbMock.mockRejectedValue(new Error("db"));
    const user = await readyForResearch();
    invokeMock.mockResolvedValueOnce({ data: regularResult, error: null });
    await user.click(screen.getByRole("button", { name: /start research/i }));
    await screen.findByText("Idea A");
    trackMock.mockClear();
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(addToBacklogDbMock).toHaveBeenCalled();
    });
    expect(trackMock).not.toHaveBeenCalled();
  });
});
