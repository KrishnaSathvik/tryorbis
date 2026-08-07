import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const addToBacklogDbMock = vi.fn();
const trackMock = vi.fn();
const getMyGeneratorRunsMock = vi.fn();
const getMyValidationReportsMock = vi.fn();

vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: () => {} }));
vi.mock("@/lib/db", () => ({
  getMyGeneratorRuns: (...args: unknown[]) => getMyGeneratorRunsMock(...args),
  getMyValidationReports: (...args: unknown[]) =>
    getMyValidationReportsMock(...args),
  addToBacklogDb: (...args: unknown[]) => addToBacklogDbMock(...args),
  getMyBacklog: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/analytics", async () => {
  const actual = await vi.importActual<typeof import("@/lib/analytics")>(
    "@/lib/analytics",
  );
  return {
    ...actual,
    track: (...args: unknown[]) => trackMock(...args),
  };
});
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import Reports from "./Reports";

describe("Reports history idea_saved analytics", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    addToBacklogDbMock.mockResolvedValue(undefined);
    getMyGeneratorRunsMock.mockResolvedValue([
      {
        id: "run-1",
        created_at: "2026-08-06T12:00:00.000Z",
        persona: "Founders",
        category: "SaaS",
        idea_suggestions: [
          {
            name: "SQL Buddy",
            description: "Helps write SQL",
            demandScore: 80,
            mvpScope: "mvp",
            monetization: "sub",
          },
        ],
        problem_clusters: [],
      },
    ]);
    getMyValidationReportsMock.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("emits history_generator after successful save", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/history"]}>
        <Reports />
      </MemoryRouter>,
    );
    const trigger = await screen.findByText(/Founders.*SaaS|Idea discovery/i);
    await user.click(trigger.closest("button") ?? trigger);
    await screen.findByText("SQL Buddy");
    trackMock.mockClear();
    const saveBtn = screen.getByRole("button", { name: /save idea sql buddy/i });
    await user.click(saveBtn);
    await waitFor(() => {
      expect(addToBacklogDbMock).toHaveBeenCalled();
    });
    expect(trackMock).toHaveBeenCalledWith("idea_saved", {
      from: "history_generator",
    });
    const props = trackMock.mock.calls.find((c) => c[0] === "idea_saved")?.[1] as Record<
      string,
      unknown
    >;
    expect(props).not.toHaveProperty("title");
    expect(props).not.toHaveProperty("text");
    expect(props).not.toHaveProperty("idea");
  });

  it("does not emit when save fails", async () => {
    addToBacklogDbMock.mockRejectedValue(new Error("db"));
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/history"]}>
        <Reports />
      </MemoryRouter>,
    );
    const trigger = await screen.findByText(/Founders.*SaaS|Idea discovery/i);
    await user.click(trigger.closest("button") ?? trigger);
    await screen.findByText("SQL Buddy");
    trackMock.mockClear();
    await user.click(screen.getByRole("button", { name: /save idea sql buddy/i }));
    await waitFor(() => {
      expect(addToBacklogDbMock).toHaveBeenCalled();
    });
    expect(trackMock).not.toHaveBeenCalled();
  });
});
