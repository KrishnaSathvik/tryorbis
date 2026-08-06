import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReportsRemainingMeter } from "./ReportsRemainingMeter";

describe("ReportsRemainingMeter", () => {
  it("shows a loading placeholder without a report count", () => {
    render(<ReportsRemainingMeter loading remaining={null} />);

    expect(screen.getByLabelText(/loading report usage/i)).toBeInTheDocument();
    expect(screen.queryByText(/free report/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/0 free reports left/i)).not.toBeInTheDocument();
  });

  it("shows plural remaining copy when more than one report is left", () => {
    render(<ReportsRemainingMeter remaining={2} onUpgradeClick={() => {}} />);

    expect(screen.getByRole("button", { name: /2 free reports left/i })).toBeInTheDocument();
  });

  it("uses singular grammar for one remaining report", () => {
    render(<ReportsRemainingMeter remaining={1} onUpgradeClick={() => {}} />);

    expect(screen.getByRole("button", { name: /1 free report left/i })).toBeInTheDocument();
    expect(screen.queryByText(/1 free reports left/i)).not.toBeInTheDocument();
  });

  it("shows zero remaining with accessible text that is not color-only", () => {
    render(<ReportsRemainingMeter remaining={0} onUpgradeClick={() => {}} />);

    const button = screen.getByRole("button", { name: /0 free reports left/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("0 free reports left");
  });

  it("shows unlimited messaging only when isUnlimited is true", () => {
    render(<ReportsRemainingMeter remaining={0} isUnlimited />);

    expect(screen.getByText(/unlimited reports/i)).toBeInTheDocument();
    expect(screen.queryByText(/free report/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows an unavailable fallback without a fabricated count", () => {
    render(<ReportsRemainingMeter unavailable remaining={null} />);

    expect(screen.getByText(/report usage unavailable/i)).toBeInTheDocument();
    expect(screen.queryByText(/free report/i)).not.toBeInTheDocument();
  });

  it("invokes onUpgradeClick when activated with keyboard", () => {
    const onUpgradeClick = vi.fn();
    render(<ReportsRemainingMeter remaining={2} onUpgradeClick={onUpgradeClick} />);

    const button = screen.getByRole("button", { name: /2 free reports left/i });
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.keyDown(button, { key: "Enter" });
    fireEvent.click(button);

    expect(onUpgradeClick).toHaveBeenCalled();
  });

  it("opens upgrade flow via click", () => {
    const onUpgradeClick = vi.fn();
    render(<ReportsRemainingMeter remaining={0} onUpgradeClick={onUpgradeClick} />);

    fireEvent.click(screen.getByRole("button", { name: /0 free reports left/i }));
    expect(onUpgradeClick).toHaveBeenCalledTimes(1);
  });
});
