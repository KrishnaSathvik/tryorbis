import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/axe";
import { ResearchModeToggle } from "./ResearchModeToggle";

describe("ResearchModeToggle accessibility", () => {
  it("exposes two radios with correct checked state and axe cleanliness", async () => {
    const onChange = vi.fn();
    const { rerender, container } = render(
      <ResearchModeToggle mode="regular" onChange={onChange} />,
    );

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
    expect(screen.getByRole("radio", { name: /regular/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /deep research/i })).not.toBeChecked();
    expect(await axe(container)).toHaveNoViolations();

    rerender(<ResearchModeToggle mode="deep" onChange={onChange} />);
    expect(screen.getByRole("radio", { name: /deep research/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /regular/i })).not.toBeChecked();
  });

  it("has a single tab stop and arrow keys move selection with focus", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <ResearchModeToggle mode="regular" onChange={onChange} />,
    );

    await user.tab();
    expect(screen.getByRole("radio", { name: /regular/i })).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("deep");

    rerender(<ResearchModeToggle mode="deep" onChange={onChange} />);
    screen.getByRole("radio", { name: /deep research/i }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenLastCalledWith("regular");
  });

  it("preserves click selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ResearchModeToggle mode="regular" onChange={onChange} />);
    await user.click(screen.getByRole("radio", { name: /deep research/i }));
    expect(onChange).toHaveBeenCalledWith("deep");
  });
});
