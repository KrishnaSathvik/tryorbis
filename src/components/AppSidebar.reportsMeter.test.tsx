import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const useCreditsMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/hooks/useCredits", () => ({
  useCredits: () => useCreditsMock(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

vi.mock("@/components/ProfileSheet", () => ({
  ProfileSheet: ({ children }: { children: React.ReactNode }) => <div data-testid="profile-sheet">{children}</div>,
}));

vi.mock("@/components/UpgradeModal", () => ({
  UpgradeModal: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Upgrade modal">Upgrade modal</div> : null,
}));

vi.mock("@/assets/orbis-logo.png", () => ({
  default: "orbis-logo.png",
}));

import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

function renderSidebar() {
  return render(
    <MemoryRouter>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </MemoryRouter>,
  );
}

describe("AppSidebar reports meter", () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      profile: { display_name: "AuditBot" },
      user: { id: "user-1" },
      isGuest: true,
    });
  });

  it("shows the meter in authenticated app chrome for guests with remaining reports", () => {
    useCreditsMock.mockReturnValue({
      remaining: 2,
      loading: false,
      unavailable: false,
    });

    renderSidebar();

    expect(screen.getByRole("button", { name: /2 free reports left/i })).toBeInTheDocument();
    expect(screen.getByText("AuditBot")).toBeInTheDocument();
  });

  it("opens the upgrade/waitlist modal from the meter", () => {
    useCreditsMock.mockReturnValue({
      remaining: 0,
      loading: false,
      unavailable: false,
    });

    renderSidebar();

    fireEvent.click(screen.getByRole("button", { name: /0 free reports left/i }));
    expect(screen.getByRole("dialog", { name: /upgrade modal/i })).toBeInTheDocument();
  });

  it("keeps the loading meter free of a fabricated zero count", () => {
    useCreditsMock.mockReturnValue({
      remaining: null,
      loading: true,
      unavailable: false,
    });

    renderSidebar();

    expect(screen.getByLabelText(/loading report usage/i)).toBeInTheDocument();
    expect(screen.queryByText(/0 free reports left/i)).not.toBeInTheDocument();
  });
});
