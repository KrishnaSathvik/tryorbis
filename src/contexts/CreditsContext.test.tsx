import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import { useState } from "react";

const useAuthMock = vi.fn();
const singleMock = vi.fn();
const rpcMock = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: (...args: unknown[]) => singleMock(...args),
        }),
      }),
    }),
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

import { CreditsProvider, useCredits } from "./CreditsContext";

function CreditProbe({ label }: { label: string }) {
  const { remaining, loading, unavailable, hasCredits, credits } = useCredits();
  return (
    <div data-testid={label}>
      <span data-testid={`${label}-remaining`}>{remaining === null ? "null" : String(remaining)}</span>
      <span data-testid={`${label}-credits`}>{String(credits)}</span>
      <span data-testid={`${label}-loading`}>{String(loading)}</span>
      <span data-testid={`${label}-unavailable`}>{String(unavailable)}</span>
      <span data-testid={`${label}-hasCredits`}>{String(hasCredits)}</span>
    </div>
  );
}

function RefreshButton() {
  const { refreshCredits } = useCredits();
  return (
    <button type="button" onClick={() => void refreshCredits()}>
      Refresh
    </button>
  );
}

function DeductButton() {
  const { deductCredit } = useCredits();
  return (
    <button type="button" onClick={() => void deductCredit()}>
      Deduct
    </button>
  );
}

/** Mirrors Generate/Validate gate: never treat loading/unavailable as zero. */
function ResearchGate() {
  const { hasCredits, loading, unavailable } = useCredits();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const start = () => {
    if (loading || unavailable) return;
    if (!hasCredits) {
      setUpgradeOpen(true);
      return;
    }
  };

  return (
    <div>
      <button type="button" onClick={start}>
        Start research
      </button>
      {upgradeOpen ? <div role="dialog" aria-label="Upgrade modal">Upgrade</div> : null}
    </div>
  );
}

function renderWithProvider(ui: React.ReactNode) {
  return render(<CreditsProvider>{ui}</CreditsProvider>);
}

describe("CreditsProvider shared state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ user: { id: "user-a" } });
    singleMock.mockResolvedValue({
      data: { credits: 2, max_credits: 2 },
      error: null,
    });
    rpcMock.mockResolvedValue({ data: true, error: null });
  });

  it("throws when useCredits is called outside CreditsProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const Broken = () => {
      useCredits();
      return null;
    };
    expect(() => render(<Broken />)).toThrow(/CreditsProvider/);
    spy.mockRestore();
  });

  it("shares the same initial count across multiple consumers", async () => {
    renderWithProvider(
      <>
        <CreditProbe label="sidebar" />
        <CreditProbe label="page" />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-remaining")).toHaveTextContent("2");
      expect(screen.getByTestId("page-remaining")).toHaveTextContent("2");
    });

    expect(singleMock).toHaveBeenCalledTimes(1);
  });

  it("updates all consumers when refreshCredits is called from one consumer", async () => {
    renderWithProvider(
      <>
        <CreditProbe label="sidebar" />
        <CreditProbe label="page" />
        <RefreshButton />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-remaining")).toHaveTextContent("2");
    });

    singleMock.mockResolvedValueOnce({
      data: { credits: 1, max_credits: 2 },
      error: null,
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /refresh/i }));
    });

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-remaining")).toHaveTextContent("1");
      expect(screen.getByTestId("page-remaining")).toHaveTextContent("1");
    });
  });

  it("updates all consumers when deductCredit succeeds", async () => {
    renderWithProvider(
      <>
        <CreditProbe label="sidebar" />
        <CreditProbe label="page" />
        <DeductButton />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-remaining")).toHaveTextContent("2");
    });

    singleMock.mockResolvedValue({
      data: { credits: 1, max_credits: 2 },
      error: null,
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /deduct/i }));
    });

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-remaining")).toHaveTextContent("1");
      expect(screen.getByTestId("page-remaining")).toHaveTextContent("1");
    });
  });

  it("clears prior count and shows loading on auth user change", async () => {
    const { rerender } = renderWithProvider(
      <>
        <CreditProbe label="sidebar" />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-remaining")).toHaveTextContent("2");
    });

    let resolveB: (value: unknown) => void;
    const fetchB = new Promise((resolve) => {
      resolveB = resolve;
    });
    singleMock.mockReturnValueOnce(fetchB);

    useAuthMock.mockReturnValue({ user: { id: "user-b" } });
    rerender(
      <CreditsProvider>
        <CreditProbe label="sidebar" />
      </CreditsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-loading")).toHaveTextContent("true");
      expect(screen.getByTestId("sidebar-remaining")).toHaveTextContent("null");
      expect(screen.queryByText("2")).not.toBeInTheDocument();
    });

    await act(async () => {
      resolveB!({ data: { credits: 0, max_credits: 2 }, error: null });
    });

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-remaining")).toHaveTextContent("0");
      expect(screen.getByTestId("sidebar-loading")).toHaveTextContent("false");
    });
  });

  it("ignores stale responses from a previous user", async () => {
    let resolveA: (value: unknown) => void;
    const fetchA = new Promise((resolve) => {
      resolveA = resolve;
    });
    singleMock.mockReturnValueOnce(fetchA);

    const { rerender } = renderWithProvider(<CreditProbe label="sidebar" />);

    expect(screen.getByTestId("sidebar-loading")).toHaveTextContent("true");

    singleMock.mockResolvedValueOnce({
      data: { credits: 0, max_credits: 2 },
      error: null,
    });
    useAuthMock.mockReturnValue({ user: { id: "user-b" } });
    rerender(
      <CreditsProvider>
        <CreditProbe label="sidebar" />
      </CreditsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-remaining")).toHaveTextContent("0");
    });

    await act(async () => {
      resolveA!({ data: { credits: 2, max_credits: 2 }, error: null });
    });

    expect(screen.getByTestId("sidebar-remaining")).toHaveTextContent("0");
  });

  it("sets unavailable on failed fetch and clears it after a successful refresh", async () => {
    singleMock.mockResolvedValueOnce({ data: null, error: { message: "fail" } });

    renderWithProvider(
      <>
        <CreditProbe label="sidebar" />
        <RefreshButton />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-unavailable")).toHaveTextContent("true");
      expect(screen.getByTestId("sidebar-remaining")).toHaveTextContent("null");
    });

    singleMock.mockResolvedValueOnce({
      data: { credits: 2, max_credits: 2 },
      error: null,
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /refresh/i }));
    });

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-unavailable")).toHaveTextContent("false");
      expect(screen.getByTestId("sidebar-remaining")).toHaveTextContent("2");
    });
  });

  it("does not treat loading as a zero balance for hasCredits", async () => {
    let resolveFetch: (value: unknown) => void;
    singleMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    renderWithProvider(<CreditProbe label="page" />);

    expect(screen.getByTestId("page-loading")).toHaveTextContent("true");
    expect(screen.getByTestId("page-hasCredits")).toHaveTextContent("false");
    expect(screen.getByTestId("page-remaining")).toHaveTextContent("null");

    await act(async () => {
      resolveFetch!({ data: { credits: 2, max_credits: 2 }, error: null });
    });

    await waitFor(() => {
      expect(screen.getByTestId("page-hasCredits")).toHaveTextContent("true");
    });
  });

  it("does not open the upgrade modal while usage is still loading", async () => {
    let resolveFetch: (value: unknown) => void;
    singleMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    renderWithProvider(<ResearchGate />);

    fireEvent.click(screen.getByRole("button", { name: /start research/i }));
    expect(screen.queryByRole("dialog", { name: /upgrade modal/i })).not.toBeInTheDocument();

    await act(async () => {
      resolveFetch!({ data: { credits: 0, max_credits: 2 }, error: null });
    });

    await waitFor(() => {
      fireEvent.click(screen.getByRole("button", { name: /start research/i }));
      expect(screen.getByRole("dialog", { name: /upgrade modal/i })).toBeInTheDocument();
    });
  });
});
