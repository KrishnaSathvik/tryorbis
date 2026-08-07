import { describe, expect, it } from "vitest";
import {
  isIdeaSavedInBacklog,
  normalizeIdeaName,
} from "./savedIdeaMatch";

describe("normalizeIdeaName", () => {
  it("trims, lowercases, and collapses whitespace", () => {
    expect(normalizeIdeaName("  Foo   Bar  ")).toBe("foo bar");
    expect(normalizeIdeaName("SQL Prompt Buddy")).toBe("sql prompt buddy");
  });

  it("does not fuzzy-match similar strings", () => {
    expect(normalizeIdeaName("SQL Prompt Buddy")).not.toBe(
      normalizeIdeaName("SQL Prompt Buddies"),
    );
  });
});

describe("isIdeaSavedInBacklog", () => {
  const items = [
    { idea_name: "Alpha", source_id: "run-1" },
    { idea_name: "  Beta Tool  ", source_id: null },
  ];

  it("matches by stable source_id when available", () => {
    expect(
      isIdeaSavedInBacklog(items, {
        ideaName: "Different Name",
        sourceId: "run-1",
      }),
    ).toBe(true);
  });

  it("falls back to normalized idea-name matching", () => {
    expect(
      isIdeaSavedInBacklog(items, { ideaName: "beta   tool" }),
    ).toBe(true);
    expect(
      isIdeaSavedInBacklog(items, { ideaName: "Beta Tools" }),
    ).toBe(false);
  });

  it("prefers source_id over name when both could match", () => {
    expect(
      isIdeaSavedInBacklog(
        [{ idea_name: "Alpha", source_id: "other" }],
        { ideaName: "Alpha", sourceId: "missing" },
      ),
    ).toBe(false);
  });

  it("returns false for empty backlog or empty candidate", () => {
    expect(isIdeaSavedInBacklog([], { ideaName: "Alpha" })).toBe(false);
    expect(isIdeaSavedInBacklog(items, { ideaName: "   " })).toBe(false);
  });
});
