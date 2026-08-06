import { RefObject, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export type FocusComposerState = {
  focusComposer?: boolean;
  [key: string]: unknown;
};

/**
 * One-time focus of a page composer when navigated with `{ state: { focusComposer: true } }`.
 * Clears only the focus flag via replace so unrelated navigation state and hash survive.
 */
export function useFocusComposerOnArrive(ref: RefObject<HTMLElement | null>): void {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const state = (location.state as FocusComposerState | null) ?? null;
    if (!state?.focusComposer) return;

    const { focusComposer: _focusComposer, ...remainingState } = state;
    const nextState = Object.keys(remainingState).length > 0 ? remainingState : null;

    // Focus before clearing the flag so replace cannot cancel focus work.
    ref.current?.focus({ preventScroll: true });
    navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      state: nextState,
    });
  }, [location.pathname, location.search, location.hash, location.state, navigate, ref]);
}
