import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const navigateMock = vi.fn();
const signInAsGuestMock = vi.fn();
const signInMock = vi.fn();
const signUpMock = vi.fn();
const trackMock = vi.fn();
const writeOnboardingCompleteMock = vi.fn();

vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: () => {} }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    signInAsGuest: signInAsGuestMock,
    signIn: signInMock,
    signUp: signUpMock,
  }),
}));
vi.mock("@/lib/onboardingStorage", () => ({
  writeOnboardingComplete: (...args: unknown[]) =>
    writeOnboardingCompleteMock(...args),
  readOnboardingComplete: vi.fn(),
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
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import Auth from "./Auth";
import {
  LANDING_VALIDATE_PREFILL_KEY,
  writeLandingValidatePrefill,
} from "@/lib/landingValidatePrefill";

describe("Auth guest analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    signInAsGuestMock.mockResolvedValue("guest-user-1");
    signInMock.mockResolvedValue(undefined);
    signUpMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("emits auth_guest_start once after successful guest session from try route", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/auth?mode=guest"]}>
        <Auth />
      </MemoryRouter>,
    );
    await user.click(
      screen.getByRole("button", { name: /start instantly/i }),
    );
    await waitFor(() => {
      expect(signInAsGuestMock).toHaveBeenCalled();
    });
    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("auth_guest_start", {
      from: "try_route",
    });
    const props = trackMock.mock.calls[0][1] as Record<string, unknown>;
    expect(JSON.stringify(props)).not.toMatch(/auth\?|mode=|\/try|query/i);
    expect(navigateMock).toHaveBeenCalledWith("/dashboard");
  });

  it("transfers Landing prefill to Validate and marks onboarding complete", async () => {
    writeLandingValidatePrefill("Landing idea text");
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/auth?mode=guest"]}>
        <Auth />
      </MemoryRouter>,
    );
    await user.click(
      screen.getByRole("button", { name: /start instantly/i }),
    );
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/validate", {
        state: {
          validatePrefill: {
            source: "landing",
            text: "Landing idea text",
          },
        },
      });
    });
    expect(writeOnboardingCompleteMock).toHaveBeenCalledWith("guest-user-1");
    expect(sessionStorage.getItem(LANDING_VALIDATE_PREFILL_KEY)).toBeNull();
    expect(trackMock).toHaveBeenCalledWith("auth_guest_start", {
      from: "try_route",
    });
    expect(trackMock).not.toHaveBeenCalledWith(
      "onboarding_goal_select",
      expect.anything(),
    );
  });

  it("keeps Landing prefill when guest session fails", async () => {
    writeLandingValidatePrefill("keep me");
    signInAsGuestMock.mockRejectedValue(new Error("device cap"));
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/auth?mode=guest"]}>
        <Auth />
      </MemoryRouter>,
    );
    await user.click(
      screen.getByRole("button", { name: /start instantly/i }),
    );
    await waitFor(() => {
      expect(signInAsGuestMock).toHaveBeenCalled();
    });
    expect(trackMock).not.toHaveBeenCalled();
    expect(writeOnboardingCompleteMock).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem(LANDING_VALIDATE_PREFILL_KEY)!).text).toBe(
      "keep me",
    );
  });

  it("emits nothing when guest session fails", async () => {
    signInAsGuestMock.mockRejectedValue(new Error("device cap"));
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/auth?mode=guest"]}>
        <Auth />
      </MemoryRouter>,
    );
    await user.click(
      screen.getByRole("button", { name: /start instantly/i }),
    );
    await waitFor(() => {
      expect(signInAsGuestMock).toHaveBeenCalled();
    });
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("emits auth from for guest tab on normal auth page", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/auth"]}>
        <Auth />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("tab", { name: /guest/i }));
    await user.click(
      screen.getByRole("button", { name: /try as guest/i }),
    );
    await waitFor(() => {
      expect(signInAsGuestMock).toHaveBeenCalled();
    });
    expect(trackMock).toHaveBeenCalledWith("auth_guest_start", {
      from: "auth",
    });
  });

  it("does not emit for email sign-in", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/auth"]}>
        <Auth />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("tab", { name: /log in/i }));
    await user.type(screen.getByPlaceholderText("you@example.com"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Your password"), "secret1");
    await user.click(screen.getByRole("button", { name: /log in/i }));
    await waitFor(() => {
      expect(signInMock).toHaveBeenCalled();
    });
    expect(trackMock).not.toHaveBeenCalled();
  });
});
