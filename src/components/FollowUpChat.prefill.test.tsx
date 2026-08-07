import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { FollowUpChat, type FollowUpPrefillRequest } from "./FollowUpChat";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { reply: "ok" }, error: null }),
    },
  },
}));

function Harness({
  initialRequest = null,
}: {
  initialRequest?: FollowUpPrefillRequest | null;
}) {
  const [req, setReq] = useState<FollowUpPrefillRequest | null>(initialRequest);
  return (
    <div>
      <button
        type="button"
        onClick={() =>
          setReq((prev) => ({
            requestId: (prev?.requestId ?? 0) + 1,
            text: "What should I validate first for this idea?",
          }))
        }
      >
        Trigger prefill
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
  });

  it("does not overwrite existing composer text", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /ask a follow-up question/i }));
    const box = screen.getByPlaceholderText(/ask anything about this research/i);
    await user.type(box, "My draft question");
    await user.click(screen.getByRole("button", { name: /trigger prefill/i }));
    await waitFor(() => expect(box).toHaveValue("My draft question"));
  });
});
