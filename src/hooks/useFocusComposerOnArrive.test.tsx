import { describe, it, expect } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { useRef } from "react";
import { useFocusComposerOnArrive } from "@/hooks/useFocusComposerOnArrive";

function ComposerPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  useFocusComposerOnArrive(inputRef);
  const state = (location.state as Record<string, unknown> | null) ?? {};
  return (
    <div>
      <input ref={inputRef} aria-label="Main composer" />
      <span data-testid="focus-flag">{String(Boolean(state.focusComposer))}</span>
      <span data-testid="source">{String(state.source ?? "")}</span>
      <span data-testid="hash">{location.hash}</span>
    </div>
  );
}

function NavigateWithFocus({ to, state }: { to: string; state?: Record<string, unknown> }) {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(to, { state })}>
      Go
    </button>
  );
}

describe("useFocusComposerOnArrive", () => {
  it("focuses the composer once when navigation state requests it", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<NavigateWithFocus to="/tool" state={{ focusComposer: true }} />} />
          <Route path="/tool" element={<ComposerPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /go/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/main composer/i)).toHaveFocus();
    });
  });

  it("does not focus on ordinary future visits without the flag", async () => {
    render(
      <MemoryRouter initialEntries={["/tool"]}>
        <Routes>
          <Route path="/tool" element={<ComposerPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/main composer/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/main composer/i)).not.toHaveFocus();
  });

  it("consumes only focusComposer and preserves unrelated router state and hash", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={
              <NavigateWithFocus
                to="/tool?tab=compose#composer"
                state={{ focusComposer: true, source: "onboarding" }}
              />
            }
          />
          <Route path="/tool" element={<ComposerPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /go/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/main composer/i)).toHaveFocus();
      expect(screen.getByTestId("focus-flag")).toHaveTextContent("false");
      expect(screen.getByTestId("source")).toHaveTextContent("onboarding");
      expect(screen.getByTestId("hash")).toHaveTextContent("#composer");
    });
  });
});
