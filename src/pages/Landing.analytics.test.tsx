import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const navigateMock = vi.fn();
const useAuthMock = vi.fn();
const trackMock = vi.fn();
const insertMock = vi.fn();

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

import Landing from "./Landing";

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
    useAuthMock.mockReturnValue({ user: null, loading: false });
    insertMock.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("emits landing_cta_click with hero on hero CTA", async () => {
    const user = userEvent.setup();
    renderLanding();
    await user.click(screen.getByRole("button", { name: /try free — 2 reports/i }));
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

  it("emits once for keyboard activation of hero CTA", async () => {
    const user = userEvent.setup();
    renderLanding();
    const hero = screen.getByRole("button", { name: /try free — 2 reports/i });
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
