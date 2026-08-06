import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverMock);
Element.prototype.scrollIntoView = vi.fn();

const fromMock = vi.fn();
const authGetSession = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: () => {} }));
vi.mock("@/hooks/useFocusComposerOnArrive", () => ({
  useFocusComposerOnArrive: () => {},
}));
vi.mock("@/hooks/useDropZone", () => ({
  useDropZone: () => ({ isDragging: false, dropZoneProps: {} }),
}));
vi.mock("@/hooks/useVoiceInput", () => ({
  useVoiceInput: () => ({
    isListening: false,
    isSupported: false,
    startListening: vi.fn(),
    stopListening: vi.fn(),
  }),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    auth: { getSession: (...args: unknown[]) => authGetSession(...args) },
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/FileUpload", () => ({
  FileUpload: ({
    onAttachmentsChange,
  }: {
    onAttachmentsChange: (a: unknown[]) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onAttachmentsChange([
          {
            id: "att-1",
            file: new File(["x"], "note.txt", { type: "text/plain" }),
            preview: "",
            type: "text",
            base64: "hello",
          },
        ])
      }
    >
      Add attachment
    </button>
  ),
}));
vi.mock("@/components/AttachmentPreview", () => ({
  AttachmentPreview: () => <div>Attachment preview</div>,
}));
vi.mock("@/components/ImagePreviewModal", () => ({
  ImagePreviewModal: () => null,
}));
vi.mock("@/components/VoiceButton", () => ({ VoiceButton: () => null }));
vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

import OrbisChat from "@/pages/OrbisChat";

function renderChat() {
  return render(
    <MemoryRouter>
      <OrbisChat />
    </MemoryRouter>,
  );
}

describe("OrbisChat starter chips", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ user: { id: "u1" } });
    authGetSession.mockResolvedValue({
      data: { session: { access_token: "tok" } },
    });

    const insertMock = vi.fn().mockResolvedValue({ data: { id: "c1" }, error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    const selectEqEq = vi.fn().mockResolvedValue({ data: [], error: null });
    const selectEq = vi.fn().mockReturnValue({
      eq: selectEqEq,
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn(),
    });

    fromMock.mockImplementation((table: string) => {
      if (table === "conversations") {
        return {
          insert: () => ({ select: () => ({ single: insertMock }) }),
          update: updateMock,
          select: () => ({ eq: selectEq }),
        };
      }
      if (table === "chat_messages") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
          select: () => ({ eq: () => ({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
        };
      }
      return {};
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => {
          let done = false;
          return {
            read: async () => {
              if (done) return { done: true, value: undefined };
              done = true;
              return {
                done: false,
                value: new TextEncoder().encode(
                  'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: [DONE]\n\n',
                ),
              };
            },
          };
        },
      },
      json: async () => ({}),
    }) as unknown as typeof fetch;
  });

  it("shows the four existing suggestions on empty chat", () => {
    renderChat();
    expect(screen.getByRole("button", { name: /saas tool/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /unmet needs/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /first 100 users/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /two startup ideas/i })).toBeInTheDocument();
  });

  it("selecting one sends exactly once and hides suggestions", async () => {
    const user = userEvent.setup();
    renderChat();
    await user.click(screen.getByRole("button", { name: /saas tool/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("button", { name: /saas tool/i })).not.toBeInTheDocument();
  });

  it("rapid double activation does not duplicate the request", async () => {
    const user = userEvent.setup();
    renderChat();
    const chip = screen.getByRole("button", { name: /saas tool/i });
    await user.dblClick(chip);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("hides suggestions after typing", async () => {
    const user = userEvent.setup();
    renderChat();
    await user.type(screen.getByPlaceholderText(/ask orbis anything/i), "hi");
    expect(screen.queryByRole("button", { name: /saas tool/i })).not.toBeInTheDocument();
  });

  it("hides suggestions after attachment selection", async () => {
    const user = userEvent.setup();
    renderChat();
    await user.click(screen.getByRole("button", { name: /add attachment/i }));
    expect(screen.queryByRole("button", { name: /saas tool/i })).not.toBeInTheDocument();
  });

  it("starting a new empty chat restores suggestions", async () => {
    const user = userEvent.setup();
    renderChat();
    await user.click(screen.getByRole("button", { name: /saas tool/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /new chat/i }));
    expect(screen.getByRole("button", { name: /saas tool/i })).toBeInTheDocument();
  });
});
