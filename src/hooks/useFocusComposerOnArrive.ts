import { RefObject, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export type FocusComposerState = {
  focusComposer?: boolean;
};

/**
 * One-time focus of a page composer when navigated with `{ state: { focusComposer: true } }`.
 * Clears the flag via replace so refresh / later visits do not keep stealing focus.
 */
export function useFocusComposerOnArrive(ref: RefObject<HTMLElement | null>): void {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const state = (location.state as FocusComposerState | null) ?? null;
    if (!state?.focusComposer) return;

    // Focus before clearing state so a replace navigation cannot cancel the focus timer.
    ref.current?.focus({ preventScroll: true });
    navigate(`${location.pathname}${location.search}`, { replace: true, state: {} });
  }, [location.pathname, location.search, location.state, navigate, ref]);
}
