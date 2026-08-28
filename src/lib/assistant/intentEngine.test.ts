import { describe, it, expect } from "vitest";
import {
  matchIntent,
  topIntents,
  normalizeInput,
  keywordMatchCount,
  scoreIntent,
  intentsFromFaq,
  type Intent,
} from "./intentEngine";

const intents: Intent[] = [
  { id: "skills", keywords: ["skill", "stack", "tech"] },
  { id: "projects", keywords: ["project", "work", "built", "coba"] },
  { id: "contact", keywords: ["email", "contact", "reach"] },
  { id: "location", keywords: ["where", "location", "based"] },
  { id: "ai", keywords: ["ai"] },
  { id: "startup", keywords: ["startup"], weight: 2 },
];

describe("normalizeInput", () => {
  it("lowercases and trims", () => {
    expect(normalizeInput("  Hallo Dunia  ")).toBe("hallo dunia");
  });
});

describe("keywordMatchCount", () => {
  it("counts matches separated by non-word chars", () => {
    expect(keywordMatchCount("i love machine skill and skill", "skill")).toBe(2);
  });

  it("matches keyword as a prefix of a word (plural/partial)", () => {
    expect(keywordMatchCount("my skillset includes", "skill")).toBe(1);
  });

  it("ignores keyword nested mid-word (anti-false-positive)", () => {
    expect(keywordMatchCount("gainsaid and mailbox", "ai")).toBe(0);
  });

  it("returns 0 for empty keyword", () => {
    expect(keywordMatchCount("anything", "")).toBe(0);
  });

  it("escapes regex metacharacters", () => {
    expect(keywordMatchCount("c++ and c#", "c++")).toBe(1);
  });
});

describe("matchIntent", () => {
  it("matches exact keyword", () => {
    const result = matchIntent("what skills do you have?", intents);
    expect(result?.intent.id).toBe("skills");
  });

  it("is case-insensitive", () => {
    const result = matchIntent("SKILLS", intents);
    expect(result?.intent.id).toBe("skills");
  });

  it("matches partial / word-continuation input", () => {
    const result = matchIntent("tell me about your projects", intents);
    expect(result?.intent.id).toBe("projects");
  });

  it("matches keyword mid-sentence", () => {
    const result = matchIntent("do you use ai for anything?", intents);
    expect(result?.intent.id).toBe("ai");
  });

  it("ignores keyword nested mid-word (anti-false-positive)", () => {
    expect(matchIntent("gainsaid", intents)?.intent.id).not.toBe("ai");
    expect(matchIntent("said mailbox", intents)).toBeNull();
  });

  it("returns null for no match", () => {
    expect(matchIntent("zzz qqq xxx", intents)).toBeNull();
  });

  it("returns null for empty / whitespace input", () => {
    expect(matchIntent("   ", intents)).toBeNull();
    expect(matchIntent("", intents)).toBeNull();
  });

  it("respects configured threshold", () => {
    const result = matchIntent("skill", intents, { threshold: 5 });
    expect(result).toBeNull();
  });

  it("applies keyword weight boost", () => {
    const weighted = matchIntent("build me a startup", intents, { threshold: 2 });
    expect(weighted?.intent.id).toBe("startup");
  });
});

describe("scoreIntent", () => {
  it("scores zero when no keyword present", () => {
    expect(scoreIntent("nothing here", intents[0])).toBe(0);
  });

  it("scores > 0 when keyword matches", () => {
    expect(scoreIntent("skill stack", intents[0])).toBeGreaterThan(0);
  });
});

describe("topIntents", () => {
  it("ranks intents by score descending", () => {
    const result = topIntents("contact email skills", intents, 3);
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
  });

  it("is bounded by n", () => {
    const result = topIntents("skill stack tech project work", intents, 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it("returns empty for non-matching input", () => {
    expect(topIntents("abc def", intents, 5)).toEqual([]);
  });
});

describe("intentsFromFaq", () => {
  it("maps faq items to intents", () => {
    const faq = [
      { id: "a", category: "x", keywords: ["k1", "k2"], question: "q", answer: "a" },
      { id: "b", category: "x", keywords: ["k3"], question: "q", answer: "a" },
    ];
    const result = intentsFromFaq(faq);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: "a", keywords: ["k1", "k2"] });
  });
});
