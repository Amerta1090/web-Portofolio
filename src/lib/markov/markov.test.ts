import { describe, expect, it } from "vitest";
import { END, buildGraph, generate, hashSeed, mulberry32, tokensOf, walk } from "./markov";

const CORPUS = [
  "the quick brown fox jumps over the lazy dog",
  "the quick rabbit hops through the grass",
  "the lazy fox sleeps all day",
];

describe("markov", () => {
  describe("tokensOf", () => {
    it("splits a sentence into words", () => {
      expect(tokensOf("the quick brown fox")).toEqual(["the", "quick", "brown", "fox"]);
    });

    it("strips surrounding punctuation", () => {
      expect(tokensOf("  Hello, world!  ")).toEqual(["Hello", "world"]);
    });

    it("drops empty tokens", () => {
      expect(tokensOf("   ")).toEqual([]);
    });
  });

  describe("buildGraph", () => {
    it("builds a transition for each token with END markers", () => {
      const g = buildGraph(["a b c"]);
      expect(g.get("a")).toEqual(["b"]);
      expect(g.get("b")).toEqual(["c"]);
      expect(g.get("c")).toEqual([END]);
    });

    it("keeps duplicates so frequency weights the pick", () => {
      const g = buildGraph(["a b", "a b"]);
      expect(g.get("a")).toEqual(["b", "b"]);
    });

    it("keys are case-insensitive", () => {
      const g = buildGraph(["A b", "a b"]);
      expect(g.get("a")).toEqual(["b", "b"]);
    });

    it("ignores empty sentences", () => {
      const g = buildGraph(["", "   "]);
      expect(g.size).toBe(0);
    });
  });

  describe("mulberry32 / hashSeed", () => {
    it("hashSeed is deterministic", () => {
      expect(hashSeed("hello")).toBe(hashSeed("hello"));
    });

    it("mulberry32 is deterministic for a fixed seed", () => {
      const a = mulberry32(42);
      const b = mulberry32(42);
      const seqA = Array.from({ length: 5 }, () => a());
      const seqB = Array.from({ length: 5 }, () => b());
      expect(seqA).toEqual(seqB);
    });

    it("different seeds yield different sequences", () => {
      const a = mulberry32(1);
      const b = mulberry32(2);
      expect(a()).not.toBe(b());
    });

    it("outputs values in [0, 1)", () => {
      const rng = mulberry32(7);
      for (let i = 0; i < 100; i++) {
        const v = rng();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });
  });

  describe("walk", () => {
    it("walks a known chain deterministically with a fixed rng", () => {
      const g = buildGraph(["the quick brown fox"]);
      const rng = () => 0; // always pick index 0
      expect(walk(g, "the", rng)).toEqual(["quick", "brown", "fox"]);
    });

    it("stops at END", () => {
      const g = buildGraph(["the quick"]);
      expect(walk(g, "the", () => 0)).toEqual(["quick"]);
    });

    it("respects maxTokens", () => {
      const g = buildGraph(["a b c d e"]);
      expect(walk(g, "a", () => 0, 3)).toEqual(["b", "c", "d"]);
    });

    it("returns empty for unknown start token", () => {
      const g = buildGraph(["a b"]);
      expect(walk(g, "zzz", () => 0)).toEqual([]);
    });
  });

  describe("generate", () => {
    it("produces deterministic output for a fixed seed", () => {
      const g = buildGraph(CORPUS);
      expect(generate(g, { seed: 123 })).toBe(generate(g, { seed: 123 }));
    });

    it("respects a start token", () => {
      const g = buildGraph(["the quick brown"]);
      const out = generate(g, { start: "the", rng: () => 0 });
      expect(out).toContain("quick");
    });

    it("can honour an injected rng", () => {
      const g = buildGraph(["the quick"]);
      const out = generate(g, { start: "the", rng: () => 0 });
      expect(out).toBe("quick");
    });

    it("returns empty string for an empty graph", () => {
      expect(generate(new Map())).toBe("");
    });

    it("emits a non-empty string from a real corpus", () => {
      const g = buildGraph(CORPUS);
      const out = generate(g, { seed: 5 });
      expect(out.length).toBeGreaterThan(0);
    });

    it("does not contain END sentinel in output", () => {
      const g = buildGraph(CORPUS);
      const out = generate(g, { seed: 9, maxTokens: 100 });
      expect(out).not.toContain(END);
      expect(out).not.toContain("\u0000");
    });
  });
});
