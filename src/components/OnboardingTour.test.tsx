import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

const useAuthMock = vi.fn();
const trackMock = vi.fn();

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

import { OnboardingTour } from "./OnboardingTour";
import {
  ONBOARDING_LEGACY_KEY,
  onboardingCompleteKey,
  readOnboardingComplete,
  writeOnboardingComplete,
} from "@/lib/onboardingStorage";

function LocationProbe() {
  const location = useLocation();
  return (
    <div data-testid="location">
      <span data-testid="pathname">{location.pathname}</span>
      <span data-testid="focus-flag">{String(Boolean((location.state as { focusComposer?: boolean } | null)?.focusComposer))}</span>
    </div>
  );
}

function renderTour(initialPath = "/dashboard") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <OnboardingTour />
      <Routes>
        <Route path="/dashboard" element={<main><h1>Dashboard</h1><button type="button">Find Ideas to Build</button></main>} />
        <Route path="/generate" element={<LocationProbe />} />
        <Route path="/validate" element={<LocationProbe />} />
        <Route path="/chat" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("onboarding storage helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("scopes completion by user id", () => {
    writeOnboardingComplete("user-a");
    expect(readOnboardingComplete("user-a")).toBe(true);
    expect(readOnboardingComplete("user-b")).toBe(false);
    expect(localStorage.getItem(onboardingCompleteKey("user-a"))).toBe("true");
  });

  it("migrates legacy global key once to the current user and removes it", () => {
    localStorage.setItem(ONBOARDING_LEGACY_KEY, "true");
    expect(readOnboardingComplete("user-a")).toBe(true);
    expect(localStorage.getItem(onboardingCompleteKey("user-a"))).toBe("true");
    expect(localStorage.getItem(ONBOARDING_LEGACY_KEY)).toBeNull();
  });

  it("does not treat user B as completed after user A received the legacy migration", () => {
    localStorage.setItem(ONBOARDING_LEGACY_KEY, "true");
    expect(readOnboardingComplete("user-a")).toBe(true);
    expect(readOnboardingComplete("user-b")).toBe(false);
    expect(localStorage.getItem(onboardingCompleteKey("user-b"))).toBeNull();
  });

  it("prefers an existing scoped key and clears leftover legacy to protect other users", () => {
    writeOnboardingComplete("user-a");
    localStorage.setItem(ONBOARDING_LEGACY_KEY, "true");
    expect(readOnboardingComplete("user-a")).toBe(true);
    expect(localStorage.getItem(onboardingCompleteKey("user-a"))).toBe("true");
    expect(localStorage.getItem(ONBOARDING_LEGACY_KEY)).toBeNull();
    expect(readOnboardingComplete("user-b")).toBe(false);
  });

  it("returns false and does not throw when storage fails", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(readOnboardingComplete("user-a")).toBe(false);
    spy.mockRestore();

    const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => writeOnboardingComplete("user-a")).not.toThrow();
    setSpy.mockRestore();

    localStorage.setItem(ONBOARDING_LEGACY_KEY, "true");
    const removeSpy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => readOnboardingComplete("user-a")).not.toThrow();
    removeSpy.mockRestore();
  });
});

describe("OnboardingTour goal routing", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthMock.mockReturnValue({
      user: { id: "user-a" },
      loading: false,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("shows goal onboarding for a first-time user on the dashboard", async () => {
    renderTour();
    expect(await screen.findByRole("dialog", { name: /what do you want to do first/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /find product ideas/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /validate an idea/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /talk to orbis ai/i })).toBeInTheDocument();
  });

  it("does not show for a returning completed user", () => {
    writeOnboardingComplete("user-a");
    renderTour();
    expect(screen.queryByRole("dialog", { name: /what do you want to do first/i })).not.toBeInTheDocument();
  });

  it("does not show when visiting a tool route directly", () => {
    renderTour("/generate");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each([
    [/find product ideas/i, "/generate"],
    [/validate an idea/i, "/validate"],
    [/talk to orbis ai/i, "/chat"],
  ] as const)("navigates %s to %s with one-time focus request", async (label, path) => {
    renderTour();
    fireEvent.click(await screen.findByRole("button", { name: label }));
    await waitFor(() => {
      expect(screen.getByTestId("pathname")).toHaveTextContent(path);
      expect(screen.getByTestId("focus-flag")).toHaveTextContent("true");
    });
    expect(readOnboardingComplete("user-a")).toBe(true);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("persists completion and stays on dashboard when skipping", async () => {
    renderTour();
    fireEvent.click(await screen.findByRole("button", { name: /^skip$/i }));
    await waitFor(() => {
      expect(readOnboardingComplete("user-a")).toBe(true);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
  });

  it("activates goal cards with keyboard Enter", async () => {
    renderTour();
    const goal = await screen.findByRole("button", { name: /validate an idea/i });
    goal.focus();
    fireEvent.keyDown(goal, { key: "Enter", code: "Enter" });
    fireEvent.click(goal);
    await waitFor(() => {
      expect(screen.getByTestId("pathname")).toHaveTextContent("/validate");
    });
  });

  it("exposes an accessible dialog title and description", async () => {
    renderTour();
    const dialog = await screen.findByRole("dialog", { name: /what do you want to do first/i });
    expect(within(dialog).getByText(/choose a starting point/i)).toBeInTheDocument();
  });

  it("keeps completion independent per user id", async () => {
    writeOnboardingComplete("user-a");
    useAuthMock.mockReturnValue({ user: { id: "user-b" }, loading: false });
    renderTour();
    expect(await screen.findByRole("dialog", { name: /what do you want to do first/i })).toBeInTheDocument();
  });

  it("still navigates when storage write fails", async () => {
    const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    renderTour();
    fireEvent.click(await screen.findByRole("button", { name: /find product ideas/i }));
    await waitFor(() => {
      expect(screen.getByTestId("pathname")).toHaveTextContent("/generate");
    });
    setSpy.mockRestore();
  });

  it("shows a Skip control and no Close button", async () => {
    renderTour();
    const dialog = await screen.findByRole("dialog", { name: /what do you want to do first/i });
    expect(within(dialog).getByRole("button", { name: /^skip$/i })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /^close$/i })).not.toBeInTheDocument();
  });

  it("persists completion on Escape and stays on the dashboard", async () => {
    renderTour();
    const dialog = await screen.findByRole("dialog", { name: /what do you want to do first/i });
    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(readOnboardingComplete("user-a")).toBe(true);
    });
    expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
  });

  it("shows onboarding for a different user after another user completed it", async () => {
    writeOnboardingComplete("user-a");
    useAuthMock.mockReturnValue({ user: { id: "user-b" }, loading: false });
    renderTour();
    expect(await screen.findByRole("dialog", { name: /what do you want to do first/i })).toBeInTheDocument();
  });
});

describe("OnboardingTour analytics", () => {
  beforeEach(() => {
    localStorage.clear();
    trackMock.mockClear();
    useAuthMock.mockReturnValue({
      user: { id: "user-a" },
      loading: false,
    });
  });

  afterEach(() => {
    localStorage.clear();
    trackMock.mockClear();
  });

  it.each([
    [/find product ideas/i, "generate"],
    [/validate an idea/i, "validate"],
    [/talk to orbis ai/i, "chat"],
  ] as const)("emits onboarding_goal_select for %s", async (label, goal) => {
    renderTour();
    fireEvent.click(await screen.findByRole("button", { name: label }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith("onboarding_goal_select", { goal });
    });
    expect(trackMock).toHaveBeenCalledTimes(1);
  });

  it("emits onboarding_skip once from Skip", async () => {
    renderTour();
    fireEvent.click(await screen.findByRole("button", { name: /^skip$/i }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith("onboarding_skip");
    });
    expect(trackMock).toHaveBeenCalledTimes(1);
  });

  it("does not duplicate Skip on Escape dismissal", async () => {
    renderTour();
    const dialog = await screen.findByRole("dialog", { name: /what do you want to do first/i });
    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(trackMock).toHaveBeenCalledWith("onboarding_skip");
    expect(trackMock).toHaveBeenCalledTimes(1);
  });

  it("does not emit on render alone", async () => {
    renderTour();
    await screen.findByRole("dialog", { name: /what do you want to do first/i });
    expect(trackMock).not.toHaveBeenCalled();
  });
});
