import { describe, expect, it } from "vitest";
import grammar from "../../../data/capability-grammars.json";
import { expand } from "./tracery";

const SYMBOLS = ["capability", "project_blurb", "fact"] as const;

describe("capability grammar file shape", () => {
  it("defines every required top-level symbol", () => {
    for (const symbol of SYMBOLS) {
      expect(grammar, `missing symbol "${symbol}"`).toHaveProperty(symbol);
    }
  });

  it("every expansion is a non-empty string", () => {
    for (const symbol of SYMBOLS) {
      const rules = grammar[symbol];
      const expansions = Array.isArray(rules) ? rules : [rules];
      expect(expansions.length).toBeGreaterThan(0);
      for (const expansion of expansions) {
        expect(typeof expansion).toBe("string");
        expect(expansion.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("grammar expansion", () => {
  it("expands every symbol without leftover template markers", () => {
    for (const symbol of SYMBOLS) {
      const out = expand(grammar, symbol, { seed: "test" });
      expect(out.length).toBeGreaterThan(0);
      expect(out).not.toMatch(/#/);
    }
  });

  it("resolves sub-symbols inside capability templates", () => {
    const out = expand(grammar, "capability", { seed: "sub" });
    // Template sentence: verb + system + ending clause; must read as a sentence.
    expect(/\w/.test(out)).toBe(true);
    expect(out.endsWith(".")).toBe(true);
    expect(out.split(" ").length).toBeGreaterThanOrEqual(6);
  });

  it("project_blurb always yields one of the known blurbs", () => {
    const blurbs = grammar.project_blurb;
    for (let i = 0; i < 8; i++) {
      const out = expand(grammar, "project_blurb", { seed: `blurb-${i}` });
      expect(blurbs as string[]).toContain(out);
    }
  });

  it("fact always yields one of the known facts", () => {
    const facts = grammar.fact as string[];
    const out = expand(grammar, "fact", { seed: "fact-check" });
    expect(facts).toContain(out);
  });

  it("does not recurse infinitely (no cycles in grammar)", () => {
    for (const symbol of SYMBOLS) {
      expect(() => expand(grammar, symbol)).not.toThrow();
    }
  });
});

describe("deterministic variation", () => {
  it("is deterministic — same seed, same output", () => {
    for (const symbol of SYMBOLS) {
      expect(expand(grammar, symbol, { seed: "fixed" })).toBe(
        expand(grammar, symbol, { seed: "fixed" }),
      );
    }
  });

  it("produces multiple variants across seeds for capability", () => {
    const seen = new Set(
      Array.from({ length: 40 }, (_, i) => expand(grammar, "capability", { seed: `v${i}` })),
    );
    expect(seen.size).toBeGreaterThan(4);
  });

  it("every capability variant is distinctly formatted", () => {
    for (let i = 0; i < 30; i++) {
      const out = expand(grammar, "capability", { seed: `f-${i}` });
      expect(out).not.toMatch(/#|\[|\]/);
      expect(out).toBe(out.trim());
    }
  });
});
