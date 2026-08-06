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
  saveValidationReportDb: vi.fn(),
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
vi.mock("@/components/VerdictBadge", () => ({ VerdictBadge: () => null }));
vi.mock("@/components/ValidationScorecard", () => ({ ValidationScorecard: () => null }));
vi.mock("@/components/AIHandoff", () => ({ AIHandoff: () => null }));
vi.mock("@/components/VoiceButton", () => ({ VoiceButton: () => null }));

import ValidateIdea from "@/pages/ValidateIdea";

function renderValidate() {
  return render(
    <MemoryRouter>
      <ValidateIdea />
    </MemoryRouter>,
  );
}

describe("ValidateIdea starter chips", () => {
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
    renderValidate();
    expect(
      screen.getByRole("group", { name: /validate idea starters/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Try an example")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /national parks/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /grocery-list/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /customer-support tickets/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /solo founders/i })).toBeInTheDocument();
  });

  it("fills and focuses with caret at end without AI, validation, or credit mutation", async () => {
    const user = userEvent.setup();
    renderValidate();
    const chip = screen.getByRole("button", { name: /national parks/i });
    const prompt = chip.textContent ?? "";
    await user.click(chip);
    const input = screen.getByPlaceholderText(/tracks subscriptions/i) as HTMLInputElement;
    await waitFor(() => {
      expect(input.value).toBe(prompt);
      expect(input).toHaveFocus();
      expect(input.selectionStart).toBe(prompt.length);
      expect(input.selectionEnd).toBe(prompt.length);
    });
    expect(invokeMock).not.toHaveBeenCalled();
    expect(refreshCreditsMock).not.toHaveBeenCalled();
  });

  it("hides after typing and restores when cleared", async () => {
    const user = userEvent.setup();
    renderValidate();
    const input = screen.getByPlaceholderText(/tracks subscriptions/i);
    await user.type(input, "hello");
    expect(
      screen.queryByRole("group", { name: /validate idea starters/i }),
    ).not.toBeInTheDocument();
    await user.clear(input);
    expect(
      screen.getByRole("group", { name: /validate idea starters/i }),
    ).toBeInTheDocument();
  });

  it("hides after attachment selection", async () => {
    const user = userEvent.setup();
    renderValidate();
    await user.click(screen.getByRole("button", { name: /add attachment/i }));
    expect(
      screen.queryByRole("group", { name: /validate idea starters/i }),
    ).not.toBeInTheDocument();
  });

  it("hides after a user message", async () => {
    const user = userEvent.setup();
    renderValidate();
    await user.type(screen.getByPlaceholderText(/tracks subscriptions/i), "my idea");
    await user.keyboard("{Enter}");
    await waitFor(() => expect(invokeMock).toHaveBeenCalled());
    expect(
      screen.queryByRole("group", { name: /validate idea starters/i }),
    ).not.toBeInTheDocument();
  });
});
