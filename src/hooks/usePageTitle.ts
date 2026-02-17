import { useEffect } from "react";

const BASE = "Orbis";

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${BASE}` : `${BASE} — AI-Powered Product Research & Validation`;
  }, [title]);
}
