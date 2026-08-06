import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const navigateMock = vi.fn();
const signInAsGuestMock = vi.fn();
const signInMock = vi.fn();
const signUpMock = vi.fn();
const trackMock = vi.fn();

vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: () => {} }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    signInAsGuest: signInAsGuestMock,
    signIn: signInMock,
    signUp: signUpMock,
  }),
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

describe("Auth guest analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signInAsGuestMock.mockResolvedValue(undefined);
    signInMock.mockResolvedValue(undefined);
    signUpMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
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
