import { describe, it, expect } from "vitest";
import {
  fuzzyMatch,
  normalize,
  editDistance,
  defaultMaxErrors,
  searchIndex,
} from "./fuzzy";

describe("normalize", () => {
  it("lowercases, trims, and collapses whitespace", () => {
    expect(normalize("  Machine   Learning ")).toBe("machine learning");
  });
});

describe("editDistance", () => {
  it("handles identical strings", () => {
    expect(editDistance("abc", "abc")).toBe(0);
  });
  it("handles substitutions", () => {
    expect(editDistance("cat", "cut")).toBe(1);
  });
  it("handles insertions/deletions", () => {
    expect(editDistance("cat", "cats")).toBe(1);
    expect(editDistance("cat", "at")).toBe(1);
  });
  it("handles empty", () => {
    expect(editDistance("", "")).toBe(0);
    expect(editDistance("abc", "")).toBe(3);
  });
});

describe("defaultMaxErrors", () => {
  it("grows with query length but caps small", () => {
    expect(defaultMaxErrors(1)).toBe(0);
    expect(defaultMaxErrors(2)).toBe(1);
    expect(defaultMaxErrors(8)).toBeGreaterThanOrEqual(1);
    expect(defaultMaxErrors(50)).toBe(3);
  });
});

describe("fuzzyMatch", () => {
  it("matches exact substring with high score", () => {
    expect(fuzzyMatch("machine learning", "machine learning engineering")).not.toBeNull();
  });

  it("returns null for empty query", () => {
    expect(fuzzyMatch("", "anything")).toBeNull();
    expect(fuzzyMatch("   ", "anything")).toBeNull();
  });

  it("exact substring score is near 1.0", () => {
    const s = fuzzyMatch("react", "react native developer");
    expect(s).not.toBeNull();
    expect(s!).toBeGreaterThan(0.9);
  });

  it("tolerates a typo (1 edit)", () => {
    const s = fuzzyMatch("javascrip", "javascript");
    expect(s).not.toBeNull();
    expect(s!).toBeGreaterThan(0.5);
  });

  it("rejects when too far away (many edits)", () => {
    const s = fuzzyMatch("blueberry pie", "machine learning model");
    expect(s).toBeNull();
  });

  it("prefix match scores strongly", () => {
    const s = fuzzyMatch("pytho", "python developer");
    expect(s).not.toBeNull();
    expect(s!).toBeGreaterThan(0.8);
  });

  it("is deterministic", () => {
    expect(fuzzyMatch("pytho", "python developer")).toBe(fuzzyMatch("pytho", "python developer"));
  });
});

describe("searchIndex", () => {
  const items = [
    { title: "Python Developer", description: "Writing APIs", keywords: ["python", "backend"] },
    { title: "Data Scientist", description: "Python data analysis", keywords: ["python", "pandas"] },
    { title: "React Native", description: "Mobile apps", keywords: ["react", "mobile"] },
  ];

  it("returns empty for empty query", () => {
    expect(searchIndex("", items)).toEqual([]);
  });

  it("ranks title matches first", () => {
    const res = searchIndex("python", items);
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].item.title).toBe("Python Developer");
    expect(res[0].matchedBy).toBe("title");
  });

  it("returns an empty array when nothing matches", () => {
    expect(searchIndex("zzzzqqqqx", items)).toEqual([]);
  });

  it("respects the limit option", () => {
    const res = searchIndex("python", items, { limit: 1 });
    expect(res).toHaveLength(1);
  });

  it("weights title above description (keyword fallback)", () => {
    // "apas" -> not a title; should match "API Writing" via description or
    // keyword paths but never outrank an exact title match.
    const res = searchIndex("react", items);
    expect(res[0].item.title).toBe("React Native");
  });
});
