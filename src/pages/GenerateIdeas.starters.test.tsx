import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

Element.prototype.scrollIntoView = vi.fn();

const invokeMock = vi.fn();
const useCreditsMock = vi.fn();
const refreshCreditsMock = vi.fn();

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
  saveGeneratorRunDb: vi.fn(),
  addToBacklogDb: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/FileUpload", () => ({
  FileUpload: ({
    onAttachmentsChange,
  }: {
    onAttachmentsChange: (a: unknown[]) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onAttachmentsChange([
          {
            id: "att-1",
            file: new File(["x"], "note.txt", { type: "text/plain" }),
            preview: "",
            type: "text",
            base64: "hello",
          },
        ])
      }
    >
      Add attachment
    </button>
  ),
}));
vi.mock("@/components/AttachmentPreview", () => ({
  AttachmentPreview: () => <div>Attachment preview</div>,
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
vi.mock("@/components/AIHandoff", () => ({ AIHandoff: () => null }));
vi.mock("@/components/VoiceButton", () => ({ VoiceButton: () => null }));

import GenerateIdeas from "@/pages/GenerateIdeas";

function renderGenerate() {
  return render(
    <MemoryRouter>
      <GenerateIdeas />
    </MemoryRouter>,
  );
}

describe("GenerateIdeas starter chips", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refreshCreditsMock.mockResolvedValue(undefined);
    useCreditsMock.mockReturnValue({
      hasCredits: true,
      refreshCredits: refreshCreditsMock,
      loading: false,
      unavailable: false,
    });
    invokeMock.mockResolvedValue({ data: { reply: "ok", ready: false }, error: null });
  });

  it("shows at least four starters in the untouched state", () => {
    renderGenerate();
    expect(
      screen.getByRole("group", { name: /generate idea starters/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Try an example")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /small business owners/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /data teams/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /frequent travelers/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /independent creators/i })).toBeInTheDocument();
  });

  it("fills and focuses the composer with caret at end without AI, research, or credits", async () => {
    const user = userEvent.setup();
    renderGenerate();
    const chip = screen.getByRole("button", { name: /small business owners/i });
    const prompt = chip.textContent ?? "";
    await user.click(chip);
    const input = screen.getByPlaceholderText(/sql prompt buddy/i) as HTMLInputElement;
    await waitFor(() => {
      expect(input.value).toBe(prompt);
      expect(input).toHaveFocus();
      expect(input.selectionStart).toBe(prompt.length);
      expect(input.selectionEnd).toBe(prompt.length);
    });
    expect(invokeMock).not.toHaveBeenCalled();
    expect(refreshCreditsMock).not.toHaveBeenCalled();
  });

  it("hides chips after typing and restores when cleared", async () => {
    const user = userEvent.setup();
    renderGenerate();
    const input = screen.getByPlaceholderText(/sql prompt buddy/i);
    await user.type(input, "hello");
    expect(
      screen.queryByRole("group", { name: /generate idea starters/i }),
    ).not.toBeInTheDocument();
    await user.clear(input);
    expect(
      screen.getByRole("group", { name: /generate idea starters/i }),
    ).toBeInTheDocument();
  });

  it("hides chips after attachment selection without clearing the attachment", async () => {
    const user = userEvent.setup();
    renderGenerate();
    await user.click(screen.getByRole("button", { name: /add attachment/i }));
    expect(
      screen.queryByRole("group", { name: /generate idea starters/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/attachment preview/i)).toBeInTheDocument();
  });

  it("hides chips after a user message", async () => {
    const user = userEvent.setup();
    renderGenerate();
    await user.type(screen.getByPlaceholderText(/sql prompt buddy/i), "my idea");
    await user.keyboard("{Enter}");
    await waitFor(() => expect(invokeMock).toHaveBeenCalled());
    expect(
      screen.queryByRole("group", { name: /generate idea starters/i }),
    ).not.toBeInTheDocument();
  });
});
