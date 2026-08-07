import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/axe";
import { FollowUpChat } from "./FollowUpChat";

const invokeMock = vi.fn().mockResolvedValue({
  data: { reply: "Here is a follow-up answer." },
  error: null,
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => invokeMock(...args),
    },
  },
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

Element.prototype.scrollIntoView = vi.fn();

describe("FollowUpChat accessibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("supports keyboard open → type → send without auto-send on open", async () => {
    const user = userEvent.setup();
    render(
      <FollowUpChat reportContext="ctx" onRevalidate={vi.fn()} />,
    );

    await user.click(
      screen.getByRole("button", { name: /ask a follow-up question/i }),
    );
    expect(invokeMock).not.toHaveBeenCalled();

    const region = screen.getByRole("region", {
      name: /follow-up chat with orbis ai/i,
    });
    expect(await axe(region)).toHaveNoViolations();

    const box = screen.getByLabelText(/ask a follow-up question/i);
    await user.type(box, "How do I differentiate?");
    await user.click(
      screen.getByRole("button", { name: /send follow-up message/i }),
    );

    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByText(/here is a follow-up answer/i),
    ).toBeInTheDocument();
  });

  it("does not auto-send when Ask Orbis prefills", async () => {
    const user = userEvent.setup();
    render(
      <FollowUpChat
        reportContext="ctx"
        onRevalidate={vi.fn()}
        prefillRequest={{
          requestId: 1,
          text: "What should I validate first?",
        }}
      />,
    );

    const box = await screen.findByLabelText(/ask a follow-up question/i);
    await waitFor(() =>
      expect(box).toHaveValue("What should I validate first?"),
    );
    expect(invokeMock).not.toHaveBeenCalled();
    await user.tab();
    expect(invokeMock).not.toHaveBeenCalled();
  });
});
