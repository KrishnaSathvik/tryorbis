import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { clearWaitlistJoined, writeWaitlistJoined } from "@/lib/waitlistStorage";

const useAuthMock = vi.fn();
const useCreditsMock = vi.fn();
const insertMock = vi.fn();
const toastSuccess = vi.fn();
const toastInfo = vi.fn();
const toastError = vi.fn();
const navigateMock = vi.fn();
const trackMock = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/hooks/useCredits", () => ({
  useCredits: () => useCreditsMock(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: (...args: unknown[]) => insertMock(...args),
    }),
  },
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

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    info: (...args: unknown[]) => toastInfo(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

import { UpgradeModal } from "./UpgradeModal";

function renderModal(
  props: Partial<{
    open: boolean;
    mode: "general" | "quota_exhausted";
    source: "meter" | "generate" | "validate" | "dashboard" | "profile";
  }> = {},
) {
  const onOpenChange = vi.fn();
  const result = render(
    <MemoryRouter>
      <UpgradeModal
        open={props.open ?? true}
        onOpenChange={onOpenChange}
        mode={props.mode}
        source={props.source}
      />
    </MemoryRouter>,
  );
  return { onOpenChange, ...result };
}

describe("UpgradeModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearWaitlistJoined("user-1");
    clearWaitlistJoined("guest@example.com");
    useAuthMock.mockReturnValue({
      user: { id: "user-1" },
      profile: { email: "user@example.com", display_name: "Test" },
      isGuest: false,
    });
    useCreditsMock.mockReturnValue({
      remaining: 0,
      loading: false,
      unavailable: false,
    });
    insertMock.mockResolvedValue({ error: null });
  });

  it("general mode retains waitlist behavior without exhausted copy", () => {
    useCreditsMock.mockReturnValue({
      remaining: 2,
      loading: false,
      unavailable: false,
    });
    renderModal({ mode: "general" });

    expect(screen.getByRole("heading", { name: /orbis pro/i })).toBeInTheDocument();
    expect(screen.queryByText(/you.?ve used your free research reports/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /join.*waitlist/i })).toBeInTheDocument();
    expect(screen.getAllByText(/coming soon/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/upgrade now|subscribe now|payment successful|unlock instantly/i)).not.toBeInTheDocument();
  });

  it("exhausted mode uses accurate exhausted copy and continuation actions", () => {
    renderModal({ mode: "quota_exhausted" });

    expect(
      screen.getByRole("heading", { name: /you.?ve used your free research reports/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/generate and validate/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with orbis ai/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /my ideas/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^history$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /join.*waitlist/i })).toBeInTheDocument();
    expect(screen.queryByText(/upgrade now|subscribe now|your pro plan|payment successful|unlimited active/i)).not.toBeInTheDocument();
  });

  it("does not claim active billing or unlimited access today", () => {
    renderModal({ mode: "quota_exhausted" });
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/does not activate Pro or restore reports/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Coming soon\. No charge until launch\./i)).toBeInTheDocument();
    expect(within(dialog).queryByText(/start unlimited|unlock instantly/i)).not.toBeInTheDocument();
  });

  it("navigates to chat with one-time composer focus and closes", () => {
    const { onOpenChange } = renderModal({ mode: "quota_exhausted" });

    fireEvent.click(screen.getByRole("button", { name: /continue with orbis ai/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(navigateMock).toHaveBeenCalledWith("/chat", {
      state: { focusComposer: true, source: "quota_exhausted" },
    });
  });

  it("navigates to My Ideas and History and closes", () => {
    const { onOpenChange } = renderModal({ mode: "quota_exhausted" });

    fireEvent.click(screen.getByRole("button", { name: /my ideas/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(navigateMock).toHaveBeenCalledWith("/ideas");

    onOpenChange.mockClear();
    navigateMock.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /^history$/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(navigateMock).toHaveBeenCalledWith("/history");
  });

  it("waitlist pending prevents duplicate submission", async () => {
    let resolveInsert: (value: { error: null }) => void = () => {};
    insertMock.mockReturnValue(
      new Promise((resolve) => {
        resolveInsert = resolve;
      }),
    );
    renderModal({ mode: "quota_exhausted" });

    const join = screen.getByRole("button", { name: /join.*waitlist/i });
    fireEvent.click(join);
    expect(join).toBeDisabled();
    expect(join).toHaveTextContent(/joining/i);
    fireEvent.click(join);
    expect(insertMock).toHaveBeenCalledTimes(1);
    resolveInsert({ error: null });
    await waitFor(() => expect(screen.getByText(/you.?re on the waitlist/i)).toBeInTheDocument());
  });

  it("waitlist success does not alter report count and keeps continuation usable", async () => {
    renderModal({ mode: "quota_exhausted" });

    fireEvent.click(screen.getByRole("button", { name: /join.*waitlist/i }));
    await waitFor(() => expect(screen.getByText(/you.?re on the waitlist/i)).toBeInTheDocument());

    expect(useCreditsMock().remaining).toBe(0);
    expect(screen.getByRole("button", { name: /continue with orbis ai/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /my ideas/i })).toBeEnabled();
    expect(toastSuccess).toHaveBeenCalled();
    const successMsg = String(toastSuccess.mock.calls[0]?.[0] ?? "");
    expect(successMsg.toLowerCase()).not.toMatch(/additional reports|unlimited active|pro plan unlocked/);
  });

  it("waitlist failure leaves continuation actions usable", async () => {
    insertMock.mockResolvedValue({ error: { message: "network boom" } });
    renderModal({ mode: "quota_exhausted" });

    fireEvent.click(screen.getByRole("button", { name: /join.*waitlist/i }));
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(String(toastError.mock.calls[0]?.[0])).not.toMatch(/network boom/);
    expect(screen.getByRole("button", { name: /continue with orbis ai/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /join.*waitlist/i })).toBeEnabled();
  });

  it("shows already-waitlisted state when detectable from local storage", () => {
    writeWaitlistJoined("user-1");
    renderModal({ mode: "quota_exhausted" });
    expect(screen.getByText(/you.?re on the waitlist/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /join.*waitlist/i })).not.toBeInTheDocument();
  });

  it("closes exhausted modal when credits become available", async () => {
    const { onOpenChange, rerender } = renderModal({ mode: "quota_exhausted" });
    useCreditsMock.mockReturnValue({
      remaining: 1,
      loading: false,
      unavailable: false,
    });
    rerender(
      <MemoryRouter>
        <UpgradeModal open onOpenChange={onOpenChange} mode="quota_exhausted" />
      </MemoryRouter>,
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("guest can enter email for waitlist", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "guest-1" },
      profile: { display_name: "Guest", email: null },
      isGuest: true,
    });
    renderModal({ mode: "general" });

    fireEvent.change(screen.getByLabelText(/your email/i), {
      target: { value: "guest@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /join.*waitlist/i }));
    await waitFor(() =>
      expect(insertMock).toHaveBeenCalledWith({
        email: "guest@example.com",
        user_id: "guest-1",
      }),
    );
  });

  it("treats duplicate waitlist errors as already joined", async () => {
    insertMock.mockResolvedValue({ error: { message: "duplicate key value" } });
    renderModal({ mode: "quota_exhausted" });
    fireEvent.click(screen.getByRole("button", { name: /join.*waitlist/i }));
    await waitFor(() => expect(screen.getByText(/you.?re on the waitlist/i)).toBeInTheDocument());
    expect(toastInfo).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /continue with orbis ai/i })).toBeEnabled();
  });

  it("supports keyboard activation of continuation actions", () => {
    const { onOpenChange } = renderModal({ mode: "quota_exhausted" });
    const chat = screen.getByRole("button", { name: /continue with orbis ai/i });
    chat.focus();
    fireEvent.keyDown(chat, { key: "Enter", code: "Enter" });
    fireEvent.click(chat);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(navigateMock).toHaveBeenCalledWith("/chat", expect.any(Object));
  });
});

describe("UpgradeModal analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearWaitlistJoined("user-1");
    useAuthMock.mockReturnValue({
      user: { id: "user-1" },
      profile: { email: "user@example.com", display_name: "Test" },
      isGuest: false,
    });
    useCreditsMock.mockReturnValue({
      remaining: 0,
      loading: false,
      unavailable: false,
    });
    insertMock.mockResolvedValue({ error: null });
  });

  it("emits waitlist_join once on successful insert", async () => {
    renderModal({ mode: "quota_exhausted", source: "generate" });
    fireEvent.click(screen.getByRole("button", { name: /join.*waitlist/i }));
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith("waitlist_join", {
        source: "upgrade_exhausted",
      });
    });
    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(trackMock.mock.calls)).not.toMatch(/user@example\.com|user-1/);
  });

  it("does not emit waitlist_join on failed insert", async () => {
    insertMock.mockResolvedValue({ error: { message: "network boom" } });
    renderModal({ mode: "quota_exhausted" });
    fireEvent.click(screen.getByRole("button", { name: /join.*waitlist/i }));
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("does not emit waitlist_join on duplicate response", async () => {
    insertMock.mockResolvedValue({ error: { message: "duplicate key value" } });
    renderModal({ mode: "quota_exhausted" });
    fireEvent.click(screen.getByRole("button", { name: /join.*waitlist/i }));
    await waitFor(() => expect(screen.getByText(/you.?re on the waitlist/i)).toBeInTheDocument());
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("emits post_quota_chat_click from exhausted Continue with Orbis AI", () => {
    renderModal({ mode: "quota_exhausted" });
    fireEvent.click(screen.getByRole("button", { name: /continue with orbis ai/i }));
    expect(trackMock).toHaveBeenCalledWith("post_quota_chat_click");
  });

  it("does not emit on modal render alone", () => {
    renderModal({ mode: "quota_exhausted" });
    expect(trackMock).not.toHaveBeenCalled();
  });
});
