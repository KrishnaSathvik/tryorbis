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

  it("gives each instance a unique textarea id and label association", async () => {
    const { container } = render(
      <>
        <FollowUpChat
          reportContext="ctx-a"
          onRevalidate={vi.fn()}
          regionLabel="Follow-up chat for generator report Alpha"
          prefillRequest={{ requestId: 1, text: "Alpha question" }}
        />
        <FollowUpChat
          reportContext="ctx-b"
          onRevalidate={vi.fn()}
          regionLabel="Follow-up chat for validation report Beta"
          prefillRequest={{ requestId: 1, text: "Beta question" }}
        />
      </>,
    );

    const boxes = await screen.findAllByLabelText(/ask a follow-up question/i);
    expect(boxes).toHaveLength(2);
    const id0 = boxes[0].id;
    const id1 = boxes[1].id;
    expect(id0).toBeTruthy();
    expect(id1).toBeTruthy();
    expect(id0).not.toBe(id1);

    const labels = container.querySelectorAll(
      'label[for].sr-only, label.sr-only[for]',
    );
    const fors = Array.from(labels).map((label) => label.getAttribute("for"));
    expect(fors).toEqual(expect.arrayContaining([id0, id1]));

    expect(
      screen.getByRole("region", {
        name: /follow-up chat for generator report alpha/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", {
        name: /follow-up chat for validation report beta/i,
      }),
    ).toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });
});
