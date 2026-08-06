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
const toastError = vi.fn();
const conversationInsertSingle = vi.fn();
const messageInsert = vi.fn();
const conversationUpdateEq = vi.fn();

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
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: (...args: unknown[]) => toastError(...args) },
}));
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

function okStreamBody(content = "Hello") {
  return {
    getReader: () => {
      let done = false;
      return {
        read: async () => {
          if (done) return { done: true, value: undefined };
          done = true;
          return {
            done: false,
            value: new TextEncoder().encode(
              `data: {"choices":[{"delta":{"content":"${content}"}}]}\n\ndata: [DONE]\n\n`,
            ),
          };
        },
      };
    },
  };
}

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

    conversationInsertSingle.mockResolvedValue({ data: { id: "c1" }, error: null });
    messageInsert.mockResolvedValue({ error: null });
    conversationUpdateEq.mockResolvedValue({ error: null });

    fromMock.mockImplementation((table: string) => {
      if (table === "conversations") {
        return {
          insert: () => ({
            select: () => ({ single: (...args: unknown[]) => conversationInsertSingle(...args) }),
          }),
          update: () => ({ eq: (...args: unknown[]) => conversationUpdateEq(...args) }),
          select: () => ({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      if (table === "chat_messages") {
        return {
          insert: (...args: unknown[]) => messageInsert(...args),
          select: () => ({
            eq: () => ({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }
      return {};
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: okStreamBody(),
      json: async () => ({}),
    }) as unknown as typeof fetch;
  });

  it("shows the four existing suggestions on empty chat with contextual group label", () => {
    renderChat();
    expect(screen.getByRole("group", { name: /orbis ai starters/i })).toBeInTheDocument();
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
    expect(conversationInsertSingle).toHaveBeenCalledTimes(1);
    expect(messageInsert).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /saas tool/i })).not.toBeInTheDocument();
  });

  it("rapid double activation does not duplicate the request", async () => {
    const user = userEvent.setup();
    renderChat();
    const chip = screen.getByRole("button", { name: /saas tool/i });
    await user.dblClick(chip);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(conversationInsertSingle).toHaveBeenCalledTimes(1);
  });

  it("ordinary typed message sending still works", async () => {
    const user = userEvent.setup();
    renderChat();
    await user.type(
      screen.getByPlaceholderText(/ask orbis anything/i),
      "typed hello{Enter}",
    );
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(messageInsert).toHaveBeenCalled();
  });

  it("conversation creation failure releases the lock so retry works", async () => {
    const user = userEvent.setup();
    conversationInsertSingle
      .mockResolvedValueOnce({ data: null, error: { message: "fail" } })
      .mockResolvedValueOnce({ data: { id: "c2" }, error: null });

    renderChat();
    await user.click(screen.getByRole("button", { name: /saas tool/i }));
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(global.fetch).not.toHaveBeenCalled();

    const input = screen.getByPlaceholderText(/ask orbis anything/i);
    await waitFor(() => {
      expect(input).toBeEnabled();
      expect((input as HTMLTextAreaElement).value).toMatch(/saas tool/i);
    });
    await user.click(input);
    await user.keyboard("{Enter}");
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });

  it("user-message persistence rejection releases the lock and skips remote chat", async () => {
    const user = userEvent.setup();
    messageInsert.mockRejectedValueOnce(new Error("persist failed"));

    renderChat();
    await user.click(screen.getByRole("button", { name: /saas tool/i }));
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("We couldn't send your message. Please try again."),
    );
    expect(global.fetch).not.toHaveBeenCalled();
    expect(toastError.mock.calls.flat().join(" ")).not.toMatch(/persist failed|internal/i);

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/ask orbis anything/i) as HTMLTextAreaElement;
      expect(input).toBeEnabled();
      expect(input.value).toMatch(/saas tool/i);
    });
  });

  it("retry after persistence failure sends successfully", async () => {
    const user = userEvent.setup();
    messageInsert
      .mockRejectedValueOnce(new Error("persist failed"))
      .mockResolvedValue({ error: null });

    renderChat();
    await user.click(screen.getByRole("button", { name: /saas tool/i }));
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("We couldn't send your message. Please try again."),
    );
    expect(global.fetch).not.toHaveBeenCalled();

    const input = screen.getByPlaceholderText(/ask orbis anything/i);
    await waitFor(() => expect(input).toBeEnabled());
    await user.click(input);
    await user.keyboard("{Enter}");
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });

  it("user insert resolved error preserves draft, attachment, and skips fetch", async () => {
    const user = userEvent.setup();
    messageInsert.mockResolvedValueOnce({
      data: null,
      error: { message: "internal test error" },
    });

    renderChat();
    const input = screen.getByPlaceholderText(/ask orbis anything/i);
    await user.type(input, "keep this draft");
    await user.click(screen.getByRole("button", { name: /add attachment/i }));
    expect(screen.getByText(/attachment preview/i)).toBeInTheDocument();
    await user.click(input);
    await user.keyboard("{Enter}");

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("We couldn't send your message. Please try again."),
    );
    expect(global.fetch).not.toHaveBeenCalled();
    expect(toastError.mock.calls.flat().join(" ")).not.toMatch(/internal test error/i);
    // Draft stays in the composer only — no sent user bubble in the transcript.
    expect(screen.queryByText((_, node) => {
      if (!node || node.tagName === "TEXTAREA") return false;
      return node.textContent === "keep this draft" && !node.children.length;
    })).not.toBeInTheDocument();

    expect(input).toBeEnabled();
    expect((input as HTMLTextAreaElement).value).toBe("keep this draft");
    expect(screen.getByText(/attachment preview/i)).toBeInTheDocument();
  });

  it("retry after resolved user persist error sends exactly once", async () => {
    const user = userEvent.setup();
    messageInsert
      .mockResolvedValueOnce({ data: null, error: { message: "internal test error" } })
      .mockResolvedValue({ error: null });

    renderChat();
    const input = screen.getByPlaceholderText(/ask orbis anything/i);
    await user.type(input, "retry me");
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("We couldn't send your message. Please try again."),
    );
    expect(global.fetch).not.toHaveBeenCalled();

    await waitFor(() => expect(input).toBeEnabled());
    await user.click(input);
    await user.keyboard("{Enter}");
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });

  it("starter-chip resolved persist error restores prompt for retry", async () => {
    const user = userEvent.setup();
    messageInsert.mockResolvedValueOnce({
      data: null,
      error: { message: "internal test error" },
    });

    renderChat();
    await user.click(screen.getByRole("button", { name: /saas tool/i }));
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("We couldn't send your message. Please try again."),
    );
    expect(global.fetch).not.toHaveBeenCalled();

    const input = screen.getByPlaceholderText(/ask orbis anything/i) as HTMLTextAreaElement;
    await waitFor(() => {
      expect(input).toBeEnabled();
      expect(input.value).toMatch(/saas tool/i);
    });
  });

  it("assistant insert resolved error keeps streamed reply and shows save toast", async () => {
    const user = userEvent.setup();
    messageInsert
      .mockResolvedValueOnce({ error: null }) // user
      .mockResolvedValueOnce({ data: null, error: { message: "internal test error" } }); // assistant

    renderChat();
    await user.click(screen.getByRole("button", { name: /saas tool/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText("Hello")).toBeInTheDocument());
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "The reply was shown, but it could not be saved to history.",
      ),
    );
    expect(toastError.mock.calls.flat().join(" ")).not.toMatch(/internal test error/i);
    expect(toastError).not.toHaveBeenCalledWith(expect.stringMatching(/failed to get response/i));
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/ask orbis anything/i)).toBeEnabled(),
    );
  });

  it("timestamp update resolved error is non-fatal", async () => {
    const user = userEvent.setup();
    conversationUpdateEq.mockResolvedValueOnce({
      data: null,
      error: { message: "internal test error" },
    });

    renderChat();
    await user.click(screen.getByRole("button", { name: /saas tool/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText("Hello")).toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/ask orbis anything/i)).toBeEnabled(),
    );
    expect(toastError).not.toHaveBeenCalledWith(expect.stringMatching(/failed to get response/i));
    expect(toastError.mock.calls.flat().join(" ")).not.toMatch(/internal test error/i);
  });

  it("remote fetch failure releases the lock", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    renderChat();
    await user.click(screen.getByRole("button", { name: /saas tool/i }));
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/ask orbis anything/i)).toBeEnabled(),
    );
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
