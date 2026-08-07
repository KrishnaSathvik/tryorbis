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
  it("matching source ID with different name → true", () => {
    expect(
      isIdeaSavedInBacklog(
        [{ idea_name: "Alpha", source_id: "run-1" }],
        { ideaName: "Different Name", sourceId: "run-1" },
      ),
    ).toBe(true);
  });

  it("missing source ID on legacy row + same normalized name → true", () => {
    expect(
      isIdeaSavedInBacklog(
        [{ idea_name: "  Beta Tool  ", source_id: null }],
        { ideaName: "beta   tool", sourceId: "run-new" },
      ),
    ).toBe(true);
  });

  it("conflicting non-empty source ID + same name → false", () => {
    expect(
      isIdeaSavedInBacklog(
        [{ idea_name: "Alpha", source_id: "other" }],
        { ideaName: "Alpha", sourceId: "missing" },
      ),
    ).toBe(false);
  });

  it("candidate without source ID + same normalized name → true", () => {
    expect(
      isIdeaSavedInBacklog(
        [
          { idea_name: "Alpha", source_id: "run-1" },
          { idea_name: "  Beta Tool  ", source_id: null },
        ],
        { ideaName: "beta   tool" },
      ),
    ).toBe(true);
  });

  it("similar but non-identical name → false", () => {
    expect(
      isIdeaSavedInBacklog(
        [{ idea_name: "Beta Tool", source_id: null }],
        { ideaName: "Beta Tools" },
      ),
    ).toBe(false);
  });

  it("returns false for empty backlog or empty candidate name without source", () => {
    expect(isIdeaSavedInBacklog([], { ideaName: "Alpha" })).toBe(false);
    expect(
      isIdeaSavedInBacklog([{ idea_name: "Alpha", source_id: null }], {
        ideaName: "   ",
      }),
    ).toBe(false);
  });
});
