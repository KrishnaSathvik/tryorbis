import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  GenerateNextStepCard,
  ValidateNextStepCard,
} from "./ReportNextStepCards";

const trackMock = vi.fn();

vi.mock("@/lib/analytics", () => ({
  track: (...args: unknown[]) => trackMock(...args),
}));

describe("ReportNextStepCards missing handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("omits secondary actions without handlers", () => {
    render(
      <GenerateNextStepCard
        topIdeaName="Alpha"
        ideaCount={1}
        inHistory={false}
        ideaSaved={false}
        handlers={{
          onValidateIdea: vi.fn(),
          onAskOrbis: vi.fn(),
          // save omitted
        }}
      />,
    );
    expect(
      screen.getByRole("button", { name: /validate “alpha”/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ask orbis/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save idea/i })).not.toBeInTheDocument();
  });

  it("does not render an enabled dead primary button when primary handler is missing", () => {
    const { container } = render(
      <ValidateNextStepCard
        verdict="Build"
        inHistory={false}
        ideaSaved={false}
        handlers={{
          onAskOrbis: vi.fn(),
          onViewHistory: vi.fn(),
          // save primary missing
        }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("invokes real handlers for every rendered action", async () => {
    const user = userEvent.setup();
    const onValidateIdea = vi.fn();
    const onAskOrbis = vi.fn();
    render(
      <GenerateNextStepCard
        topIdeaName="Alpha"
        ideaCount={1}
        inHistory={false}
        ideaSaved={false}
        handlers={{ onValidateIdea, onAskOrbis }}
      />,
    );
    await user.click(screen.getByRole("button", { name: /validate “alpha”/i }));
    await user.click(screen.getByRole("button", { name: /ask orbis/i }));
    expect(onValidateIdea).toHaveBeenCalledTimes(1);
    expect(onAskOrbis).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledTimes(2);
  });
});
