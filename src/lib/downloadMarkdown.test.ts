import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadMarkdownFile } from "./downloadMarkdown";

describe("downloadMarkdownFile", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.fn>;
  let appendSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.fn>;
  let createdAnchor: HTMLAnchorElement | null;

  beforeEach(() => {
    vi.useFakeTimers();
    createdAnchor = null;
    createObjectURL = vi.fn(() => "blob:mock-url");
    revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL as typeof URL.createObjectURL;
    URL.revokeObjectURL = revokeObjectURL as typeof URL.revokeObjectURL;

    clickSpy = vi.fn();
    removeSpy = vi.fn(function (this: HTMLAnchorElement) {
      this.remove = HTMLElement.prototype.remove;
      HTMLElement.prototype.remove.call(this);
    });
    appendSpy = vi.spyOn(document.body, "appendChild");

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName.toLowerCase() === "a") {
        createdAnchor = el as HTMLAnchorElement;
        createdAnchor.click = clickSpy;
        createdAnchor.remove = removeSpy as unknown as typeof createdAnchor.remove;
      }
      return el;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("creates a markdown blob, clicks a temporary anchor, and revokes the object URL", () => {
    const hrefBefore = window.location.href;

    downloadMarkdownFile("# Hello\n", "orbis-test-validation.md");

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("text/markdown;charset=utf-8");

    expect(createdAnchor).not.toBeNull();
    expect(createdAnchor!.href).toContain("blob:mock-url");
    expect(createdAnchor!.download).toBe("orbis-test-validation.md");
    expect(appendSpy).toHaveBeenCalledWith(createdAnchor);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(1);

    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    expect(window.location.href).toBe(hrefBefore);
  });
});
