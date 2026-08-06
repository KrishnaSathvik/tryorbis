import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

Element.prototype.scrollIntoView = vi.fn();

const refreshCreditsMock = vi.fn();
const invokeMock = vi.fn();
const scheduleFocusMock = vi.fn(
  (getEl: () => HTMLInputElement | null, expected: string) => {
    const el = getEl();
    if (el) {
      el.focus();
      el.setSelectionRange(expected.length, expected.length);
    }
    return () => {};
  },
);

vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: () => {} }));
vi.mock("@/hooks/useCredits", () => ({
  useCredits: () => ({
    hasCredits: true,
    refreshCredits: refreshCreditsMock,
    loading: false,
    unavailable: false,
    remaining: 2,
  }),
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
vi.mock("@/lib/focusComposer", () => ({
  scheduleFocusComposerAtEnd: (...args: unknown[]) =>
    scheduleFocusMock(...(args as [() => HTMLInputElement | null, string])),
  focusComposerAndPlaceCaret: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
    from: () => ({ insert: vi.fn(), select: vi.fn() }),
  },
}));
vi.mock("@/lib/db", () => ({
  saveValidationReportDb: vi.fn(),
  addToBacklogDb: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/FileUpload", () => ({ FileUpload: () => null }));
vi.mock("@/components/AttachmentPreview", () => ({ AttachmentPreview: () => null }));
vi.mock("@/components/ResearchModeToggle", () => ({ ResearchModeToggle: () => null }));
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

import ValidateIdea from "./ValidateIdea";

function LocationProbe() {
  const location = useLocation();
  return (
    <div>
      <span data-testid="path">{location.pathname}</span>
      <span data-testid="search">{location.search}</span>
      <span data-testid="hash">{location.hash}</span>
      <span data-testid="state">{JSON.stringify(location.state)}</span>
    </div>
  );
}

describe("ValidateIdea dashboard prefill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fills composer, focuses, places caret, and consumes state once", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/validate",
            search: "?ref=dash",
            hash: "#composer",
            state: {
              dashboardValidatePrefill: {
                text: "SQL Prompt Buddy: Helps write SQL",
                sourceRunId: "g-new",
                sourceIdeaName: "SQL Prompt Buddy",
              },
              keepMe: true,
            },
          },
        ]}
      >
        <Routes>
          <Route
            path="/validate"
            element={
              <>
                <ValidateIdea />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    const input = await screen.findByPlaceholderText(/e\.g\. AI tool that tracks subscriptions/i);
    await waitFor(() => {
      expect(input).toHaveValue("SQL Prompt Buddy: Helps write SQL");
    });
    expect(scheduleFocusMock).toHaveBeenCalled();
    expect(invokeMock).not.toHaveBeenCalled();
    expect(refreshCreditsMock).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByTestId("state").textContent).toBe(
        JSON.stringify({ keepMe: true }),
      );
    });
    expect(screen.getByTestId("path")).toHaveTextContent("/validate");
    expect(screen.getByTestId("search")).toHaveTextContent("?ref=dash");
    expect(screen.getByTestId("hash")).toHaveTextContent("#composer");

    await user.type(input, "!");
    expect(input).toHaveValue("SQL Prompt Buddy: Helps write SQL!");
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("ignores malformed prefill safely and still consumes it", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/validate",
            state: { dashboardValidatePrefill: { text: "" }, other: 1 },
          },
        ]}
      >
        <Routes>
          <Route
            path="/validate"
            element={
              <>
                <ValidateIdea />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    const input = await screen.findByPlaceholderText(/e\.g\. AI tool that tracks subscriptions/i);
    expect(input).toHaveValue("");
    await waitFor(() => {
      expect(screen.getByTestId("state").textContent).toBe(JSON.stringify({ other: 1 }));
    });
  });

  it("does not overwrite existing typed work", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/validate",
            search: "?idea=Already%20here",
            state: {
              dashboardValidatePrefill: {
                text: "Should not win",
                sourceRunId: "g1",
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/validate" element={<ValidateIdea />} />
        </Routes>
      </MemoryRouter>,
    );

    // Query-param idea auto-enters confirmation; dashboard prefill must not replace it.
    await screen.findByText(/I'll validate this idea for you/i);
    expect(invokeMock).not.toHaveBeenCalled();
    expect(refreshCreditsMock).not.toHaveBeenCalled();
  });

  it.each([
    ["string", "unexpected"],
    ["number", 42],
    ["boolean", true],
    ["array", [] as unknown[]],
    ["date", new Date("2026-08-06T12:00:00.000Z")],
  ])("ignores primitive/array router state (%s) without crashing", async (_label, state) => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/validate",
            state,
          },
        ]}
      >
        <Routes>
          <Route
            path="/validate"
            element={
              <>
                <ValidateIdea />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByPlaceholderText(/e\.g\. AI tool that tracks subscriptions/i),
    ).toBeInTheDocument();
    expect(invokeMock).not.toHaveBeenCalled();
    expect(refreshCreditsMock).not.toHaveBeenCalled();
    // Primitive/array state is left untouched (no replace consume)
    expect(screen.getByTestId("state").textContent).toBe(JSON.stringify(state));
  });

  it("fills composer from canonical landing validatePrefill", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/validate",
            state: {
              validatePrefill: {
                source: "landing",
                text: "From landing prompt",
              },
              keepMe: true,
            },
          },
        ]}
      >
        <Routes>
          <Route path="/validate" element={<ValidateIdea />} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toHaveValue("From landing prompt");
    });
    expect(scheduleFocusMock).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByTestId("state").textContent).toBe(
        JSON.stringify({ keepMe: true }),
      );
    });
  });

  it("ignores object state without validatePrefill keys", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/validate",
            state: { keepMe: true, focusComposer: false },
          },
        ]}
      >
        <Routes>
          <Route
            path="/validate"
            element={
              <>
                <ValidateIdea />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByPlaceholderText(/e\.g\. AI tool that tracks subscriptions/i);
    expect(screen.getByTestId("state").textContent).toBe(
      JSON.stringify({ keepMe: true, focusComposer: false }),
    );
    expect(invokeMock).not.toHaveBeenCalled();
  });
});
