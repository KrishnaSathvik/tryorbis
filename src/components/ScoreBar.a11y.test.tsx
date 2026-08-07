import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/axe";
import { ScoreBar } from "./ScoreBar";

describe("ScoreBar accessibility", () => {
  afterEach(() => {
    cleanup();
  });

  it("exposes a focusable About-score control that opens the popover", async () => {
    const user = userEvent.setup();
    const { container } = render(<ScoreBar label="Demand" value={72} />);

    const about = screen.getByRole("button", { name: "About Demand score" });
    expect(about).toBeInTheDocument();

    about.focus();
    expect(about).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(await screen.findByText(/market demand/i)).toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });
});
