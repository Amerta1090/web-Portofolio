import { describe, expect, it } from "vitest";
import { AFINN, normalizeToken, score, tokenize } from "./afinn";

describe("sentiment/afinn", () => {
  describe("tokenize", () => {
    it("splits on non-letters and drops empties", () => {
      expect(tokenize("I   love  ## !! space")).toEqual(["i", "love", "space"]);
    });

    it("is case-insensitive and strips apostrophes at edges", () => {
      expect(tokenize("LOVE 'good'")).toEqual(["love", "good"]);
    });
  });

  describe("normalizeToken", () => {
    it("lowercases and strips punctuation", () => {
      expect(normalizeToken("  Amazing!! ")).toBe("amazing");
    });
  });

  describe("score", () => {
    it("returns zero result for empty text", () => {
      const r = score("");
      expect(r.total).toBe(0);
      expect(r.avg).toBe(0);
      expect(r.count).toBe(0);
      expect(r.words).toEqual([]);
    });

    it("returns zero for text with no lexicon hits", () => {
      const r = score("the cat sat on the mat quietly");
      expect(r.total).toBe(0);
      expect(r.avg).toBe(0);
      expect(r.magnitude).toBe(0);
      expect(r.count).toBe(0);
    });

    it("sums positive lexicon words", () => {
      const r = score("this is amazing and wonderful");
      expect(r.total).toBe(9); // amazing(5)+wonderful(4)
      expect(r.positive).toBe(2);
      expect(r.negative).toBe(0);
    });

    it("sums negative lexicon words", () => {
      const r = score("that was terrible and broken");
      expect(r.total).toBe(-8); // terrible(-5)+broken(-3)
      expect(r.negative).toBe(2);
      expect(r.positive).toBe(0);
    });

    it("mixes positive and negative", () => {
      const r = score("love the design but hate the slow load");
      expect(r.total).toBe(5 + -5 + -2); // love(5) hate(-5) slow(-2)
      expect(r.count).toBe(3);
    });

    it("computes avg clamped to -1..1", () => {
      const r = score("good good");
      expect(r.avg).toBeCloseTo(1, 4);
    });

    it("avg for mixed is the mean of scored words", () => {
      const r = score("good bad");
      // 1 + (-3) = -2 over 2 words => -1 anyway (mean -1)
      expect(r.avg).toBeCloseTo(-1, 4);
      expect(r.count).toBe(2);
    });

    it("computes magnitude as sum of abs scores", () => {
      const r = score("happy sad");
      expect(r.magnitude).toBe(3 + 3);
    });

    it("returns per-word scores in text order", () => {
      const r = score("i am happy not sad");
      expect(r.words.map((w) => w.word)).toEqual(["happy", "sad"]);
      expect(r.words[0].score).toBe(3);
      expect(r.words[1].score).toBe(-3);
    });

    it("is deterministic: same input, same result", () => {
      expect(score("this is great and terrible")).toEqual(score("this is great and terrible"));
    });
  });

  describe("AFINN lexicon", () => {
    it("has known sentiment anchors correct", () => {
      expect(AFINN.love).toBeGreaterThan(AFINN.hate);
      expect(AFINN.amazing).toBe(5);
      expect(AFINN.terrible).toBe(-5);
    });
  });
});
