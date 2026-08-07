import { describe, expect, it } from "vitest";
import {
  generatorIdeaSourceId,
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

describe("generatorIdeaSourceId", () => {
  it("scopes distinct ideas in the same run by idea id", () => {
    const alpha = generatorIdeaSourceId("run-1", {
      id: "idea-a",
      name: "Alpha",
    });
    const beta = generatorIdeaSourceId("run-1", {
      id: "idea-b",
      name: "Beta",
    });
    expect(alpha).toBe("run-1:idea:idea-a");
    expect(beta).toBe("run-1:idea:idea-b");
    expect(alpha).not.toBe(beta);
  });

  it("falls back to normalized name when idea id is missing", () => {
    expect(
      generatorIdeaSourceId("run-1", { name: "  Alpha Tool  " }),
    ).toBe("run-1:name:alpha tool");
    expect(generatorIdeaSourceId("run-1", { name: "Alpha" })).not.toBe(
      generatorIdeaSourceId("run-1", { name: "Beta" }),
    );
  });

  it("ignores blank idea ids and uses name fallback", () => {
    expect(generatorIdeaSourceId("run-1", { id: "  ", name: "Alpha" })).toBe(
      "run-1:name:alpha",
    );
  });
});

describe("isIdeaSavedInBacklog", () => {
  it("matching source ID with different name → true", () => {
    expect(
      isIdeaSavedInBacklog(
        [{ idea_name: "Alpha", source_id: "run-1:idea:idea-a" }],
        { ideaName: "Different Name", sourceId: "run-1:idea:idea-a" },
      ),
    ).toBe(true);
  });

  it("sibling idea in same run does not match via shared run id", () => {
    const betaSource = generatorIdeaSourceId("run-1", {
      id: "idea-b",
      name: "Beta",
    });
    const alphaSource = generatorIdeaSourceId("run-1", {
      id: "idea-a",
      name: "Alpha",
    });
    expect(
      isIdeaSavedInBacklog(
        [{ idea_name: "Beta", source_id: betaSource }],
        { ideaName: "Alpha", sourceId: alphaSource },
      ),
    ).toBe(false);
  });

  it("missing source ID on legacy row + same normalized name → true", () => {
    expect(
      isIdeaSavedInBacklog(
        [{ idea_name: "  Beta Tool  ", source_id: null }],
        { ideaName: "beta   tool", sourceId: "run-new:idea:x" },
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
          { idea_name: "Alpha", source_id: "run-1:idea:idea-a" },
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
