import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { FollowUpChat, type FollowUpPrefillRequest } from "./FollowUpChat";

const invokeMock = vi.fn().mockResolvedValue({ data: { reply: "ok" }, error: null });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => invokeMock(...args),
    },
  },
}));

function Harness({
  initialRequest = null,
  customText,
}: {
  initialRequest?: FollowUpPrefillRequest | null;
  customText?: string;
}) {
  const [req, setReq] = useState<FollowUpPrefillRequest | null>(initialRequest);
  return (
    <div>
      <button
        type="button"
        onClick={() =>
          setReq((prev) => ({
            requestId: (prev?.requestId ?? 0) + 1,
            text: customText ?? "What should I validate first for this idea?",
          }))
        }
      >
        Trigger prefill
      </button>
      <button
        type="button"
        onClick={() =>
          setReq((prev) =>
            prev
              ? { requestId: prev.requestId, text: prev.text }
              : { requestId: 1, text: "Same id text" },
          )
        }
      >
        Repeat same id
      </button>
      <FollowUpChat
        reportContext="ctx"
        onRevalidate={vi.fn()}
        prefillRequest={req}
      />
    </div>
  );
}

describe("FollowUpChat Ask Orbis prefill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens, prefills, and focuses without sending when composer is untouched", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /trigger prefill/i }));

    const box = await screen.findByPlaceholderText(/ask anything about this research/i);
    await waitFor(() =>
      expect(box).toHaveValue("What should I validate first for this idea?"),
    );
    await waitFor(() => expect(box).toHaveFocus());
    expect(screen.queryByText("ok")).not.toBeInTheDocument();
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("applies again when already open with empty composer and a new request id", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /trigger prefill/i }));
    const box = await screen.findByPlaceholderText(/ask anything about this research/i);
    await waitFor(() =>
      expect(box).toHaveValue("What should I validate first for this idea?"),
    );
    await user.clear(box);
    await user.click(screen.getByRole("button", { name: /trigger prefill/i }));
    await waitFor(() =>
      expect(box).toHaveValue("What should I validate first for this idea?"),
    );
    await waitFor(() => expect(box).toHaveFocus());
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("preserves draft and focuses when already-open composer has text", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /ask a follow-up question/i }));
    const box = screen.getByPlaceholderText(/ask anything about this research/i);
    await user.type(box, "My draft question");
    await user.click(screen.getByRole("button", { name: /trigger prefill/i }));
    await waitFor(() => expect(box).toHaveValue("My draft question"));
    await waitFor(() => expect(box).toHaveFocus());
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("does not reapply when the same request id is repeated", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /trigger prefill/i }));
    const box = await screen.findByPlaceholderText(/ask anything about this research/i);
    await waitFor(() =>
      expect(box).toHaveValue("What should I validate first for this idea?"),
    );
    await user.clear(box);
    await user.type(box, "edited");
    await user.click(screen.getByRole("button", { name: /repeat same id/i }));
    await waitFor(() => expect(box).toHaveValue("edited"));
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("does not overwrite existing composer text on first open", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /ask a follow-up question/i }));
    const box = screen.getByPlaceholderText(/ask anything about this research/i);
    await user.type(box, "My draft question");
    await user.click(screen.getByRole("button", { name: /trigger prefill/i }));
    await waitFor(() => expect(box).toHaveValue("My draft question"));
  });
});
