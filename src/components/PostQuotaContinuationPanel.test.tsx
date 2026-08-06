import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const useCreditsMock = vi.fn();
const navigateMock = vi.fn();
const trackMock = vi.fn();

vi.mock("@/hooks/useCredits", () => ({
  useCredits: () => useCreditsMock(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    profile: { email: "a@b.com", display_name: "A" },
    isGuest: false,
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ insert: vi.fn() }) },
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
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

import { PostQuotaContinuationPanel } from "./PostQuotaContinuationPanel";

function renderPanel() {
  return render(
    <MemoryRouter>
      <PostQuotaContinuationPanel />
    </MemoryRouter>,
  );
}

describe("PostQuotaContinuationPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows continuation panel when reports are zero", () => {
    useCreditsMock.mockReturnValue({
      remaining: 0,
      loading: false,
      unavailable: false,
    });
    renderPanel();
    expect(screen.getByTestId("post-quota-continuation-panel")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /you.?ve used your free research reports/i })).toBeInTheDocument();
  });

  it("hides when reports remain", () => {
    useCreditsMock.mockReturnValue({
      remaining: 2,
      loading: false,
      unavailable: false,
    });
    renderPanel();
    expect(screen.queryByTestId("post-quota-continuation-panel")).not.toBeInTheDocument();
  });

  it("does not flash while loading", () => {
    useCreditsMock.mockReturnValue({
      remaining: null,
      loading: true,
      unavailable: false,
    });
    renderPanel();
    expect(screen.queryByTestId("post-quota-continuation-panel")).not.toBeInTheDocument();
  });

  it("does not show when usage is unavailable", () => {
    useCreditsMock.mockReturnValue({
      remaining: null,
      loading: false,
      unavailable: true,
    });
    renderPanel();
    expect(screen.queryByTestId("post-quota-continuation-panel")).not.toBeInTheDocument();
  });

  it("navigates to chat, ideas, and history", () => {
    useCreditsMock.mockReturnValue({
      remaining: 0,
      loading: false,
      unavailable: false,
    });
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: /continue with orbis ai/i }));
    expect(navigateMock).toHaveBeenCalledWith("/chat", {
      state: { focusComposer: true, source: "quota_exhausted" },
    });

    fireEvent.click(screen.getByRole("button", { name: /my ideas/i }));
    expect(navigateMock).toHaveBeenCalledWith("/ideas");

    fireEvent.click(screen.getByRole("button", { name: /^history$/i }));
    expect(navigateMock).toHaveBeenCalledWith("/history");
  });

  it("opens waitlist modal from join action", () => {
    useCreditsMock.mockReturnValue({
      remaining: 0,
      loading: false,
      unavailable: false,
    });
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /join waitlist/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /you.?ve used your free research reports/i })).toBeInTheDocument();
  });

  it("emits post_quota_chat_click once from dashboard chat action", () => {
    useCreditsMock.mockReturnValue({
      remaining: 0,
      loading: false,
      unavailable: false,
    });
    renderPanel();
    trackMock.mockClear();
    fireEvent.click(screen.getByRole("button", { name: /continue with orbis ai/i }));
    expect(trackMock).toHaveBeenCalledWith("post_quota_chat_click");
    expect(trackMock).toHaveBeenCalledTimes(1);
  });

  it("emits quota_hit when opening waitlist from dashboard panel", () => {
    useCreditsMock.mockReturnValue({
      remaining: 0,
      loading: false,
      unavailable: false,
    });
    renderPanel();
    trackMock.mockClear();
    fireEvent.click(screen.getByRole("button", { name: /join waitlist/i }));
    expect(trackMock).toHaveBeenCalledWith("quota_hit", { surface: "dashboard" });
  });
});
