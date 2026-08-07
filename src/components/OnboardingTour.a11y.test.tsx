import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { axe } from "@/test/axe";

const useAuthMock = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/lib/analytics", async () => {
  const actual = await vi.importActual<typeof import("@/lib/analytics")>(
    "@/lib/analytics",
  );
  return {
    ...actual,
    track: vi.fn(),
  };
});

import { OnboardingTour } from "./OnboardingTour";
import { onboardingCompleteKey } from "@/lib/onboardingStorage";

function renderTour() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <OnboardingTour />
      <Routes>
        <Route
          path="/dashboard"
          element={
            <main>
              <h1 id="dashboard-welcome" tabIndex={-1}>
                Dashboard
              </h1>
              <button type="button">Find Ideas to Build</button>
            </main>
          }
        />
        <Route path="/generate" element={<div>Generate</div>} />
        <Route path="/validate" element={<div>Validate</div>} />
        <Route path="/chat" element={<div>Chat</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("OnboardingTour accessibility", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthMock.mockReturnValue({
      user: { id: "user-a11y" },
      loading: false,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("exposes dialog name/description and has no critical axe violations", async () => {
    renderTour();
    const dialog = await screen.findByRole("dialog", {
      name: /what do you want to do first/i,
    });
    expect(
      within(dialog).getByText(/choose a starting point/i),
    ).toBeInTheDocument();
    expect(await axe(dialog)).toHaveNoViolations();
  });

  it("places initial focus inside the dialog", async () => {
    renderTour();
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });

  it("keeps Tab navigation inside the dialog", async () => {
    const user = userEvent.setup();
    renderTour();
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    for (let i = 0; i < 8; i += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it("selects a goal with keyboard and completes onboarding", async () => {
    const user = userEvent.setup();
    renderTour();
    const goal = await screen.findByRole("button", {
      name: /find product ideas/i,
    });
    goal.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => {
      expect(localStorage.getItem(onboardingCompleteKey("user-a11y"))).toBe(
        "true",
      );
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("restores focus to the dashboard welcome after skip", async () => {
    const user = userEvent.setup();
    renderTour();
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: /^skip$/i }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(document.getElementById("dashboard-welcome")).toHaveFocus();
    });
  });
});
