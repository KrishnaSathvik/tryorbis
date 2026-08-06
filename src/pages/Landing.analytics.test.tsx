import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const navigateMock = vi.fn();
const useAuthMock = vi.fn();
const trackMock = vi.fn();
const insertMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: () => {} }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
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
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: (...args: unknown[]) => insertMock(...args),
    }),
  },
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: (...args: unknown[]) => toastErrorMock(...args) },
}));

import Landing from "./Landing";
import * as landingPrefill from "@/lib/landingValidatePrefill";
import {
  LANDING_VALIDATE_PREFILL_KEY,
  readLandingValidatePrefill,
  writeLandingValidatePrefill,
} from "@/lib/landingValidatePrefill";

function renderLanding() {
  return render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  );
}

describe("Landing analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    useAuthMock.mockReturnValue({ user: null, loading: false });
    insertMock.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("emits landing_cta_click with hero on Try Orbis free", async () => {
    const user = userEvent.setup();
    renderLanding();
    const form = screen.getByRole("form", { name: /validate your idea/i });
    await user.click(
      within(form).getByRole("button", { name: /^try orbis free$/i }),
    );
    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("landing_cta_click", {
      placement: "hero",
    });
    expect(navigateMock).toHaveBeenCalledWith("/try");
  });

  it("emits landing_cta_click with navigation from header Try Free", async () => {
    const user = userEvent.setup();
    renderLanding();
    await user.click(screen.getByRole("button", { name: /^try free$/i }));
    expect(trackMock).toHaveBeenCalledWith("landing_cta_click", {
      placement: "navigation",
    });
  });

  it("emits once for keyboard activation of secondary Try Orbis free", async () => {
    const user = userEvent.setup();
    renderLanding();
    const hero = within(
      screen.getByRole("form", { name: /validate your idea/i }),
    ).getByRole("button", {
      name: /^try orbis free$/i,
    });
    hero.focus();
    await user.keyboard("{Enter}");
    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("landing_cta_click", {
      placement: "hero",
    });
  });

  it("does not emit on render alone", () => {
    renderLanding();
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("disables Validate my idea until trimmed text exists", () => {
    renderLanding();
    expect(
      screen.getByRole("button", { name: /validate my idea/i }),
    ).toBeDisabled();
  });

  it("writes prefill, emits landing_prompt_submit once, and navigates /try", async () => {
    const user = userEvent.setup();
    renderLanding();
    await user.type(
      screen.getByLabelText(/describe your idea/i),
      "  AI meal planner  ",
    );
    await user.click(screen.getByRole("button", { name: /validate my idea/i }));
    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("landing_prompt_submit", {
      has_text: true,
    });
    expect(JSON.stringify(trackMock.mock.calls)).not.toMatch(/AI meal planner/i);
    expect(readLandingValidatePrefill()?.text).toBe("AI meal planner");
    expect(navigateMock).toHaveBeenCalledWith("/try");
  });

  it("submits via Cmd/Ctrl+Enter through the same handler", async () => {
    const user = userEvent.setup();
    renderLanding();
    const area = screen.getByLabelText(/describe your idea/i);
    await user.type(area, "one idea");
    await user.keyboard("{Meta>}{Enter}{/Meta}");
    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("landing_prompt_submit", {
      has_text: true,
    });
    expect(navigateMock).toHaveBeenCalledWith("/try");
  });

  it("does not emit or navigate when sessionStorage write fails", async () => {
    const writeSpy = vi
      .spyOn(landingPrefill, "writeLandingValidatePrefill")
      .mockImplementation(() => {
        throw new landingPrefill.LandingPrefillWriteError();
      });
    const user = userEvent.setup();
    renderLanding();
    await user.type(screen.getByLabelText(/describe your idea/i), "idea");
    await user.click(screen.getByRole("button", { name: /validate my idea/i }));
    expect(trackMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
    expect(toastErrorMock).toHaveBeenCalled();
    writeSpy.mockRestore();
  });

  it("clears stale Landing prefill on generic Try Orbis free", async () => {
    writeLandingValidatePrefill("abandoned");
    const user = userEvent.setup();
    renderLanding();
    await user.click(
      within(screen.getByRole("form", { name: /validate your idea/i })).getByRole(
        "button",
        {
          name: /^try orbis free$/i,
        },
      ),
    );
    expect(sessionStorage.getItem(LANDING_VALIDATE_PREFILL_KEY)).toBeNull();
    expect(trackMock).toHaveBeenCalledWith("landing_cta_click", {
      placement: "hero",
    });
  });

  it("clears Landing prefill from lower-page Try Free CTAs", async () => {
    writeLandingValidatePrefill("abandoned");
    const user = userEvent.setup();
    renderLanding();
    const lowerCtas = screen.getAllByRole("button", { name: /try it free/i });
    await user.click(lowerCtas[0]);
    expect(sessionStorage.getItem(LANDING_VALIDATE_PREFILL_KEY)).toBeNull();
  });

  it("emits waitlist_join without email on successful new insert", async () => {
    const user = userEvent.setup();
    renderLanding();
    trackMock.mockClear();
    await user.type(screen.getByPlaceholderText(/you@email\.com/i), "founder@example.com");
    await user.click(screen.getByRole("button", { name: /join waitlist/i }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith("waitlist_join", {
        source: "other",
      });
    });
    expect(trackMock).toHaveBeenCalledTimes(1);
    const props = trackMock.mock.calls[0][1] as Record<string, unknown>;
    expect(Object.keys(props)).toEqual(["source"]);
    expect(JSON.stringify(trackMock.mock.calls)).not.toMatch(/founder@example\.com/i);
    expect(screen.getByText(/you're in/i)).toBeInTheDocument();
  });

  it("does not emit waitlist_join on duplicate 23505", async () => {
    insertMock.mockResolvedValue({
      error: { code: "23505", message: "duplicate key value" },
    });
    const user = userEvent.setup();
    renderLanding();
    trackMock.mockClear();
    await user.type(screen.getByPlaceholderText(/you@email\.com/i), "dup@example.com");
    await user.click(screen.getByRole("button", { name: /join waitlist/i }));
    await waitFor(() => {
      expect(screen.getByText(/already on the list/i)).toBeInTheDocument();
    });
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("does not emit waitlist_join on non-duplicate failure and shows safe copy", async () => {
    insertMock.mockResolvedValue({
      error: { code: "57014", message: "statement timeout secret-detail" },
    });
    const user = userEvent.setup();
    renderLanding();
    trackMock.mockClear();
    await user.type(screen.getByPlaceholderText(/you@email\.com/i), "fail@example.com");
    await user.click(screen.getByRole("button", { name: /join waitlist/i }));
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
    expect(trackMock).not.toHaveBeenCalled();
    expect(screen.queryByText(/statement timeout/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/secret-detail/i)).not.toBeInTheDocument();
  });
});
