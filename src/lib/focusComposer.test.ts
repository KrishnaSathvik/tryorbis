import { describe, it, expect } from "vitest";
import { scheduleFocusComposerAtEnd } from "./focusComposer";

function nextFrames(count = 2): Promise<void> {
  return new Promise((resolve) => {
    const step = (left: number) => {
      if (left <= 0) {
        resolve();
        return;
      }
      requestAnimationFrame(() => step(left - 1));
    };
    step(count);
  });
}

describe("scheduleFocusComposerAtEnd", () => {
  it("focuses and places the caret after the expected value is present", async () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.value = "";

    const cancel = scheduleFocusComposerAtEnd(() => input, "hello world");

    await nextFrames(1);
    expect(document.activeElement).not.toBe(input);

    input.value = "hello world";
    await nextFrames(3);

    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe("hello world".length);
    expect(input.selectionEnd).toBe("hello world".length);
    cancel();
    input.remove();
  });

  it("cancel prevents focusing after unmount", async () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.value = "prompt";

    const cancel = scheduleFocusComposerAtEnd(() => input, "prompt");
    cancel();
    await nextFrames(3);

    expect(document.activeElement).not.toBe(input);
    input.remove();
  });
});
