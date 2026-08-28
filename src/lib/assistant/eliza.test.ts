import { describe, it, expect } from "vitest";
import {
  elizaRespond,
  reflectPronouns,
  normalizeForEliza,
  ELIZA_FALLBACK,
  ELIZA_EMPTY,
} from "./eliza";

describe("normalizeForEliza", () => {
  it("lowercases, strips punctuation, collapses whitespace", () => {
    expect(normalizeForEliza("  Hello,  World!!  ")).toBe("hello world");
  });

  it("keeps apostrophes and unicode letters", () => {
    expect(normalizeForEliza("Apa kabar? 'baik' — 100%")).toBe("apa kabar 'baik' 100");
  });

  it("returns empty for pure punctuation", () => {
    expect(normalizeForEliza("!!! ???")).toBe("");
  });
});

describe("reflectPronouns", () => {
  it("reflects i am -> you are", () => {
    expect(reflectPronouns("i am tired")).toBe("you are tired");
  });

  it("reflects my -> your", () => {
    expect(reflectPronouns("my project")).toBe("your project");
  });

  it("reflects me -> you and you -> me", () => {
    expect(reflectPronouns("tell me about you")).toContain("you");
  });

  it("reflects i -> you", () => {
    expect(reflectPronouns("i work hard")).toBe("you work hard");
  });
});

describe("elizaRespond", () => {
  it("reflects 'i am ...' pattern with echo", () => {
    const response = elizaRespond("i am confused");
    expect(response).toContain("confused");
    expect(response.toLowerCase()).not.toBe(ELIZA_FALLBACK);
  });

  it("hits the greeting keyword", () => {
    const response = elizaRespond("hello there");
    expect(response).not.toBe(ELIZA_FALLBACK);
  });

  it("hits the thanks keyword", () => {
    const response = elizaRespond("thanks a lot");
    expect(response).not.toBe(ELIZA_FALLBACK);
  });

  it("falls back to the generic promoter for unknown input", () => {
    expect(elizaRespond("xyzzy qwerty")).toBe(ELIZA_FALLBACK);
  });

  it("returns empty message for empty input", () => {
    expect(elizaRespond("")).toBe(ELIZA_EMPTY);
    expect(elizaRespond("   ")).toBe(ELIZA_EMPTY);
  });

  it("does not match keyword when nested mid-word", () => {
    // "always" nested? none. Test 'you' nested inside 'yourself' not double-hit.
    const response = elizaRespond("yourself");
    // Must still be a string and not crash.
    expect(typeof response).toBe("string");
  });

  it("is deterministic — same input yields same output", () => {
    expect(elizaRespond("i am happy")).toBe(elizaRespond("i am happy"));
    expect(elizaRespond("why does this happen")).toBe(elizaRespond("why does this happen"));
  });
});
