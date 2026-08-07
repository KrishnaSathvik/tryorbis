import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/axe";
import { NextStepCard } from "./NextStepCard";
import { VoiceButton } from "./VoiceButton";
import { FileUpload } from "./FileUpload";

vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe("icon-only control accessible names", () => {
  it("VoiceButton exposes start/stop labels", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const onStop = vi.fn();
    const { rerender } = render(
      <VoiceButton
        isListening={false}
        isSupported
        onStart={onStart}
        onStop={onStop}
      />,
    );
    expect(
      screen.getByRole("button", { name: /start voice input/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /start voice input/i }));
    expect(onStart).toHaveBeenCalled();

    rerender(
      <VoiceButton
        isListening
        isSupported
        onStart={onStart}
        onStop={onStop}
      />,
    );
    expect(
      screen.getByRole("button", { name: /stop voice input/i }),
    ).toBeInTheDocument();
  });

  it("FileUpload attach control is named", () => {
    render(
      <FileUpload attachments={[]} onAttachmentsChange={vi.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: /attach files/i }),
    ).toBeInTheDocument();
  });
});

describe("NextStepCard accessibility", () => {
  it("has no axe violations for a single card", async () => {
    const { container } = render(
      <NextStepCard
        landmarkLabel="Recommended next step for generated idea Alpha"
        rationale="Validate the strongest idea before investing more time."
        primaryAction={{
          id: "validate_idea",
          label: "Validate “Alpha”",
          onSelect: vi.fn(),
        }}
        secondaryActions={[
          { id: "save_idea", label: "Save idea", onSelect: vi.fn() },
          { id: "ask_orbis", label: "Ask Orbis", onSelect: vi.fn() },
        ]}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("passes axe landmark-unique with multiple cards and unique heading ids", async () => {
    const { container } = render(
      <>
        <NextStepCard
          landmarkLabel="Recommended next step for generated idea Alpha"
          rationale="Validate the strongest idea before investing more time."
          primaryAction={{
            id: "validate_idea",
            label: "Validate “Alpha”",
            onSelect: vi.fn(),
          }}
        />
        <NextStepCard
          landmarkLabel="Recommended next step for validation report Beta"
          rationale="The evidence is promising—save this idea and plan the first test."
          primaryAction={{
            id: "save_idea",
            label: "Save this idea",
            onSelect: vi.fn(),
          }}
        />
      </>,
    );

    expect(await axe(container)).toHaveNoViolations();

    const headings = screen.getAllByRole("heading", {
      name: /recommended next step/i,
    });
    expect(headings).toHaveLength(2);
    expect(headings[0].id).toBeTruthy();
    expect(headings[1].id).toBeTruthy();
    expect(headings[0].id).not.toBe(headings[1].id);
  });
});
