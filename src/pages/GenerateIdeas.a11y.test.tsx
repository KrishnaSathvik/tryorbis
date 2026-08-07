import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { axe } from "@/test/axe";

const useCreditsMock = vi.fn();

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
    isSupported: true,
    startListening: vi.fn(),
    stopListening: vi.fn(),
  }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: vi.fn() },
  },
}));
vi.mock("@/lib/db", () => ({
  saveGeneratorRunDb: vi.fn(),
  addToBacklogDb: vi.fn(),
  getMyBacklog: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/analytics", async () => {
  const actual = await vi.importActual<typeof import("@/lib/analytics")>(
    "@/lib/analytics",
  );
  return { ...actual, track: vi.fn() };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/UpgradeModal", () => ({
  UpgradeModal: () => null,
}));

import GenerateIdeas from "./GenerateIdeas";

Element.prototype.scrollIntoView = vi.fn();

describe("GenerateIdeas accessibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCreditsMock.mockReturnValue({
      hasCredits: true,
      refreshCredits: vi.fn(),
      loading: false,
      unavailable: false,
      remaining: 2,
    });
  });

  it("labels the composer and send control for keyboard users", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <GenerateIdeas />
      </MemoryRouter>,
    );

    const input = await screen.findByLabelText(
      /describe what you want to research/i,
    );
    expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /attach files/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start voice input/i }),
    ).toBeInTheDocument();

    await user.type(input, "SQL buddy for developers");
    expect(input).toHaveValue("SQL buddy for developers");

    const composer = input.closest("div");
    if (composer) {
      expect(await axe(composer)).toHaveNoViolations();
    }
  });
});
