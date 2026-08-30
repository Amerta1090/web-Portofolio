import { describe, expect, it } from "vitest";
import { cosineTags, cosineVectors, normalizeTag, toTagVector } from "./similarity";

describe("normalizeTag", () => {
  it("lowercases and trims whitespace", () => {
    expect(normalizeTag("  ML ")).toBe("ml");
    expect(normalizeTag("Python")).toBe("python");
  });
});

describe("toTagVector", () => {
  it("counts term frequency per normalized tag", () => {
    const vector = toTagVector(["ML", " ml ", "Python"]);
    expect(vector.get("ml")).toBe(2);
    expect(vector.get("python")).toBe(1);
  });

  it("returns an empty map for no tags", () => {
    expect(toTagVector([]).size).toBe(0);
  });
});

describe("cosineVectors", () => {
  it("is 1 for identical weighted vectors", () => {
    const a = new Map([
      ["ml", 1],
      ["python", 1],
    ]);
    expect(
      cosineVectors(
        a,
        new Map([
          ["python", 1],
          ["ml", 1],
        ]),
      ),
    ).toBe(1);
  });

  it("is 0 for disjoint vectors", () => {
    const a = new Map([["ml", 1]]);
    const b = new Map([["web", 1]]);
    expect(cosineVectors(a, b)).toBe(0);
  });

  it("is 0 when either vector is empty (never NaN)", () => {
    expect(cosineVectors(new Map(), new Map([["a", 1]]))).toBe(0);
    expect(cosineVectors(new Map([["a", 1]]), new Map())).toBe(0);
    expect(cosineVectors(new Map(), new Map())).toBe(0);
  });

  it("is 0 when a vector has zero weights", () => {
    expect(cosineVectors(new Map([["a", 0]]), new Map([["a", 3]]))).toBe(0);
  });

  it("scores shared tags within (0,1)", () => {
    const a = new Map([
      ["ml", 1],
      ["python", 1],
    ]);
    const b = new Map([
      ["ml", 1],
      ["web", 1],
    ]);
    expect(cosineVectors(a, b)).toBeCloseTo(0.5, 4);
  });

  it("returns exactly 1 for a shared weighted term regardless of scale", () => {
    expect(cosineVectors(new Map([["a", 2]]), new Map([["a", 5]]))).toBe(1);
  });

  it("is symmetric", () => {
    const a = new Map([
      ["ml", 1],
      ["genai", 2],
    ]);
    const b = new Map([
      ["ml", 1],
      ["web", 3],
    ]);
    expect(cosineVectors(a, b)).toBe(cosineVectors(b, a));
  });

  it("is deterministic for repeated calls", () => {
    const a = new Map([
      ["ml", 1],
      ["python", 2],
    ]);
    const b = new Map([
      ["ml", 1],
      ["web", 1],
    ]);
    const first = cosineVectors(a, b);
    for (let i = 0; i < 20; i++) {
      expect(cosineVectors(a, b)).toBe(first);
    }
  });
});

describe("cosineTags", () => {
  it("is 1 for identical tag lists regardless of order/case", () => {
    expect(cosineTags(["ML", "Python"], ["python", " ml "])).toBe(1);
  });

  it("is 0 for empty lists", () => {
    expect(cosineTags([], ["ml"])).toBe(0);
    expect(cosineTags(["ml"], [])).toBe(0);
    expect(cosineTags([], [])).toBe(0);
  });

  it("a full match dominates a doc that dilutes a shared tag", () => {
    const full = cosineTags(["python", "ml"], ["python", "ml"]);
    const diluted = cosineTags(["python", "ml"], ["python", "python", "ml"]);
    expect(full).toBe(1);
    expect(diluted).toBeLessThan(full);
    expect(diluted).toBeGreaterThan(0);
  });

  it("overlapping subset scores below a full match", () => {
    const subset = cosineTags(["ml", "python"], ["ml"]);
    expect(subset).toBeLessThan(1);
    expect(subset).toBeGreaterThan(0);
  });

  it("returns a finite number within 0..1 for every combination", () => {
    const samples: string[][] = [
      ["genai", "llm", "python", "ml"],
      ["web", "astro", "react"],
      ["iot", "esp32", "ml"],
    ];
    for (const a of samples) {
      for (const b of samples) {
        const score = cosineTags(a, b);
        expect(Number.isFinite(score)).toBe(true);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    }
  });
});
