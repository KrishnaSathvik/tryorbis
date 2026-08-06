import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { isQuotaExhausted } from "@/lib/quotaExhausted";

/**
 * Mirrors Generate/Validate research gate + UpgradeModal mode wiring.
 */
function ResearchQuotaGate({
  remaining,
  loading,
  unavailable,
}: {
  remaining: number | null;
  loading: boolean;
  unavailable: boolean;
}) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const hasCredits = (remaining ?? 0) > 0;

  const start = () => {
    if (loading || unavailable) return;
    if (!hasCredits) {
      setUpgradeOpen(true);
      return;
    }
    // research would proceed
  };

  const exhausted = isQuotaExhausted({ remaining, loading, unavailable });

  return (
    <div>
      <button type="button" onClick={start}>
        Start research
      </button>
      {upgradeOpen ? (
        <div
          role="dialog"
          aria-label={exhausted ? "Quota exhausted" : "Upgrade modal"}
          data-mode={exhausted ? "quota_exhausted" : "general"}
        >
          Continuation modal
        </div>
      ) : null}
    </div>
  );
}

describe("Generate/Validate quota gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loading does not open exhausted modal", () => {
    render(<ResearchQuotaGate remaining={null} loading unavailable={false} />);
    fireEvent.click(screen.getByRole("button", { name: /start research/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("unavailable does not open exhausted modal", () => {
    render(<ResearchQuotaGate remaining={null} loading={false} unavailable />);
    fireEvent.click(screen.getByRole("button", { name: /start research/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("positive reports allow research without modal", () => {
    render(<ResearchQuotaGate remaining={2} loading={false} unavailable={false} />);
    fireEvent.click(screen.getByRole("button", { name: /start research/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("zero reports open exhausted mode", () => {
    render(<ResearchQuotaGate remaining={0} loading={false} unavailable={false} />);
    fireEvent.click(screen.getByRole("button", { name: /start research/i }));
    expect(screen.getByRole("dialog", { name: /quota exhausted/i })).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAttribute("data-mode", "quota_exhausted");
  });
});
