import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextStepCard, type NextStepAction } from "./NextStepCard";

const trackMock = vi.fn();

vi.mock("@/lib/analytics", () => ({
  track: (...args: unknown[]) => trackMock(...args),
}));

function action(
  partial: Partial<NextStepAction> & Pick<NextStepAction, "id" | "label" | "onSelect">,
): NextStepAction {
  return partial;
}

describe("NextStepCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders rationale and primary plus up to two secondary actions", () => {
    render(
      <NextStepCard
        rationale="Validate the strongest idea before investing more time."
        primaryAction={action({
          id: "validate_idea",
          label: "Validate “Alpha”",
          onSelect: vi.fn(),
        })}
        secondaryActions={[
          action({ id: "save_idea", label: "Save idea", onSelect: vi.fn() }),
          action({ id: "ask_orbis", label: "Ask Orbis", onSelect: vi.fn() }),
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /recommended next step/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/validate the strongest idea before investing more time/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /validate “alpha”/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save idea/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ask orbis/i })).toBeInTheDocument();
  });

  it("emits no analytics on render", () => {
    render(
      <NextStepCard
        rationale="Rationale"
        primaryAction={action({
          id: "ask_orbis",
          label: "Ask Orbis",
          onSelect: vi.fn(),
        })}
      />,
    );
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("tracks exactly once before invoking the handler", async () => {
    const user = userEvent.setup();
    const order: string[] = [];
    const onSelect = vi.fn(async () => {
      order.push("handler");
    });
    trackMock.mockImplementation(() => {
      order.push("track");
    });

    render(
      <NextStepCard
        rationale="Rationale"
        primaryAction={action({
          id: "save_idea",
          label: "Save this idea",
          onSelect,
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /save this idea/i }));
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("next_step_click", {
      action: "save_idea",
    });
    expect(order).toEqual(["track", "handler"]);
    const props = trackMock.mock.calls[0][1] as Record<string, unknown>;
    expect(Object.keys(props)).toEqual(["action"]);
  });

  it("does not track or invoke disabled actions", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <NextStepCard
        rationale="Rationale"
        primaryAction={action({
          id: "save_idea",
          label: "Save idea",
          onSelect,
          disabled: true,
        })}
      />,
    );
    await user.click(screen.getByRole("button", { name: /save idea/i }));
    expect(trackMock).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("prevents double-fire while loading / pending", async () => {
    const user = userEvent.setup();
    let resolve!: () => void;
    const onSelect = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );

    render(
      <NextStepCard
        rationale="Rationale"
        primaryAction={action({
          id: "ask_orbis",
          label: "Ask Orbis",
          onSelect,
        })}
      />,
    );

    const btn = screen.getByRole("button", { name: /ask orbis/i });
    await user.click(btn);
    await user.click(btn);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledTimes(1);
    resolve();
    await waitFor(() => expect(btn).not.toBeDisabled());
  });

  it("does not emit analytics twice when the handler rejects", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn(async () => {
      throw new Error("boom");
    });

    render(
      <NextStepCard
        rationale="Rationale"
        primaryAction={action({
          id: "view_history",
          label: "View history",
          onSelect,
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /view history/i }));
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    expect(trackMock).toHaveBeenCalledTimes(1);
  });

  it("deduplicates actions that repeat an id", () => {
    render(
      <NextStepCard
        rationale="Rationale"
        primaryAction={action({
          id: "save_idea",
          label: "Save this idea",
          onSelect: vi.fn(),
        })}
        secondaryActions={[
          action({ id: "save_idea", label: "Save idea", onSelect: vi.fn() }),
          action({ id: "ask_orbis", label: "Ask Orbis", onSelect: vi.fn() }),
        ]}
      />,
    );
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /save this idea/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ask orbis/i })).toBeInTheDocument();
  });

  it("supports keyboard activation", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <NextStepCard
        rationale="Rationale"
        primaryAction={action({
          id: "validate_idea",
          label: "Validate “X”",
          onSelect,
        })}
      />,
    );
    const btn = screen.getByRole("button", { name: /validate “x”/i });
    btn.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    expect(trackMock).toHaveBeenCalledWith("next_step_click", {
      action: "validate_idea",
    });
  });

  it("gives each card a unique heading id and unique landmark label", () => {
    render(
      <>
        <NextStepCard
          landmarkLabel="Recommended next step for generated idea Alpha"
          rationale="One"
          primaryAction={action({
            id: "ask_orbis",
            label: "Ask Orbis A",
            onSelect: vi.fn(),
          })}
        />
        <NextStepCard
          landmarkLabel="Recommended next step for validation result"
          rationale="Two"
          primaryAction={action({
            id: "view_history",
            label: "View history B",
            onSelect: vi.fn(),
          })}
        />
      </>,
    );
    const headings = screen.getAllByRole("heading", {
      name: /recommended next step/i,
    });
    expect(headings).toHaveLength(2);
    const id0 = headings[0].id;
    const id1 = headings[1].id;
    expect(id0).toBeTruthy();
    expect(id1).toBeTruthy();
    expect(id0).not.toBe(id1);
    expect(headings[0].closest("section")).toHaveAttribute(
      "aria-label",
      "Recommended next step for generated idea Alpha",
    );
    expect(headings[1].closest("section")).toHaveAttribute(
      "aria-label",
      "Recommended next step for validation result",
    );
  });
});
