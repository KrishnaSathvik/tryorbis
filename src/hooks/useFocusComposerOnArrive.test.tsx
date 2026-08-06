import { describe, it, expect } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { useRef } from "react";
import { useFocusComposerOnArrive } from "@/hooks/useFocusComposerOnArrive";

function ComposerPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  useFocusComposerOnArrive(inputRef);
  return <input ref={inputRef} aria-label="Main composer" />;
}

function NavigateWithFocus({ to }: { to: string }) {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(to, { state: { focusComposer: true } })}>
      Go
    </button>
  );
}

describe("useFocusComposerOnArrive", () => {
  it("focuses the composer once when navigation state requests it", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<NavigateWithFocus to="/tool" />} />
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
});
