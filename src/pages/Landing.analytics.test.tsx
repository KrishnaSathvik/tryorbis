import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const navigateMock = vi.fn();
const useAuthMock = vi.fn();
const trackMock = vi.fn();

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
      insert: vi.fn().mockResolvedValue({ error: null }),
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
});
