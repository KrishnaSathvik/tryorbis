import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Lightbulb } from "lucide-react";
import { StarterChips, type StarterChipItem } from "./StarterChips";

const items: StarterChipItem[] = [
  { id: "a", label: "Short prompt A", value: "value-a", icon: Lightbulb },
  { id: "b", label: "A longer starter prompt that should wrap without clipping in the layout", value: "value-b" },
];

describe("StarterChips", () => {
  it("renders every supplied item with accessible names", () => {
    render(
      <StarterChips items={items} onSelect={vi.fn()} ariaLabel="Example starters" />,
    );
    expect(screen.getByRole("group", { name: /example starters/i })).toBeInTheDocument();
    expect(screen.getByText("Try an example")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /short prompt a/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /a longer starter prompt that should wrap without clipping in the layout/i,
      }),
    ).toBeInTheDocument();
  });

  it("honors contextual ariaLabel while keeping the visible heading", () => {
    render(
      <StarterChips
        items={items}
        onSelect={vi.fn()}
        ariaLabel="Generate idea starters"
      />,
    );
    expect(
      screen.getByRole("group", { name: /generate idea starters/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Try an example")).toBeInTheDocument();
  });

  it("uses ariaLabel when heading is empty without creating an empty label", () => {
    render(
      <StarterChips
        items={items}
        onSelect={vi.fn()}
        ariaLabel="Orbis AI starters"
        heading=""
      />,
    );
    expect(screen.getByRole("group", { name: /orbis ai starters/i })).toBeInTheDocument();
    expect(screen.queryByText("Try an example")).not.toBeInTheDocument();
  });

  it("calls onSelect with the correct item", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<StarterChips items={items} onSelect={onSelect} ariaLabel="Example starters" />);
    await user.click(screen.getByRole("button", { name: /short prompt a/i }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(items[0]);
  });

  it("supports native keyboard activation", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<StarterChips items={items} onSelect={onSelect} ariaLabel="Example starters" />);
    const button = screen.getByRole("button", { name: /short prompt a/i });
    button.focus();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(1);
    onSelect.mockClear();
    button.focus();
    await user.keyboard(" ");
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("disabled chips cannot select", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <StarterChips items={items} onSelect={onSelect} ariaLabel="Example starters" disabled />,
    );
    await user.click(screen.getByRole("button", { name: /short prompt a/i }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("decorative icons do not alter accessible names", () => {
    render(<StarterChips items={items} onSelect={vi.fn()} ariaLabel="Example starters" />);
    expect(screen.getByRole("button", { name: /^short prompt a$/i })).toBeInTheDocument();
  });

  it("empty items array renders nothing", () => {
    const { container } = render(
      <StarterChips items={[]} onSelect={vi.fn()} ariaLabel="Example starters" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
