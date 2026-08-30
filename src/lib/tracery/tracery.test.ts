import { describe, expect, it } from "vitest";
import { DEFAULT_MODIFIERS, TraceryError, createTracery, expand } from "./tracery";

describe("expand — basic replacement", () => {
  it("expands a plain string rule", () => {
    expect(expand({ origin: "Hello world" }, "origin")).toBe("Hello world");
  });

  it("expands a single-element array rule", () => {
    expect(expand({ origin: ["Hello world"] }, "origin")).toBe("Hello world");
  });

  it("returns one of the alternatives at random, deterministically", () => {
    const grammar = { origin: ["alpha", "beta", "gamma"] };
    const result = expand(grammar, "origin");
    expect(["alpha", "beta", "gamma"]).toContain(result);
    expect(expand(grammar, "origin")).toBe(result);
  });

  it("leaves unresolved symbols intact", () => {
    expect(expand({}, "missing")).toBe("#missing#");
    expect(expand({ origin: "see #missing# here" }, "origin")).toBe("see #missing# here");
  });

  it("handles an empty alternatives list", () => {
    expect(expand({ origin: [] }, "origin")).toBe("");
  });
});

describe("expand — sub-symbols", () => {
  it("resolves a nested sub-symbol", () => {
    const result = expand({ origin: "I love #animal#", animal: ["cats", "dogs"] }, "origin");
    expect(result).toMatch(/^I love (cats|dogs)$/);
  });

  it("resolves two levels of nesting", () => {
    const grammar = {
      origin: "#who# #verb# #thing#",
      who: ["I"],
      verb: ["build"],
      thing: ["#stack# systems"],
      stack: ["AI", "ML", "full-stack"],
    };
    const result = expand(grammar, "origin");
    expect(result).toMatch(/^I build (AI|ML|full-stack) systems$/);
  });

  it("expands multiple sub-symbols in one template", () => {
    const grammar = { origin: "#a#-#b#", a: ["x"], b: ["y", "z"] };
    expect(expand(grammar, "origin")).toMatch(/^x-(y|z)$/);
  });
});

describe("expand — modifiers", () => {
  it("applies .capitalize", () => {
    expect(expand({ origin: "#animal.capitalize#", animal: ["cats"] }, "origin")).toBe("Cats");
  });

  it("applies chained modifiers in listed order", () => {
    // capitalize -> "Cats", then upper -> "CATS"
    expect(expand({ origin: "#animal.capitalize.upper#", animal: ["cats"] }, "origin")).toBe(
      "CATS",
    );
  });

  it("applies .capitalizeAll to every word", () => {
    const result = expand(
      { origin: "#phrase.capitalizeAll#", phrase: ["big green dorito"] },
      "origin",
    );
    expect(result).toBe("Big Green Dorito");
  });

  it("applies .upper and .lower", () => {
    expect(expand({ origin: "#w.upper#", w: ["mix"] }, "origin")).toBe("MIX");
    expect(expand({ origin: "#w.lower#", w: ["MiX"] }, "origin")).toBe("mix");
    expect(expand({ origin: "#w.trim#", w: ["  padded  "] }, "origin")).toBe("padded");
  });

  it("passes through unknown modifiers unchanged", () => {
    const result = expand({ origin: "#animal.banana#", animal: ["cats"] }, "origin");
    expect(result).toBe("cats");
  });

  it("supports custom modifiers via options", () => {
    const marked = (t: string) => `[${t}]`;
    const result = expand({ origin: "#w.marked#", w: ["box"] }, "origin", {
      modifiers: { ...DEFAULT_MODIFIERS, marked },
    });
    expect(result).toBe("[box]");
  });
});

describe("expand — recursion & safety guards", () => {
  it("throws on direct self-recursion", () => {
    expect(() => expand({ a: "#a#" }, "a")).toThrow(TraceryError);
  });

  it("throws on mutual recursion", () => {
    expect(() => expand({ a: "#b#", b: "#a#" }, "a")).toThrow(TraceryError);
    expect(() => expand({ a: "#b#", b: "#a#" }, "a")).toThrow(/Recursion/);
  });

  it("throws when exceeding a small custom maxDepth", () => {
    const grammar = { a: "#b#", b: "#c#", c: "done" };
    expect(() => expand(grammar, "a", { maxDepth: 1 })).toThrow(TraceryError);
  });

  it("expands deep (but bounded) chains within maxDepth", () => {
    const grammar = { a: "#b#", b: "#c#", c: "done" };
    expect(expand(grammar, "a")).toBe("done");
  });
});

describe("expand — determinism", () => {
  it("is deterministic across repeated calls (no seed)", () => {
    const grammar = { origin: ["#a#", "#b#", "#c#"], a: "p", b: "q", c: "r" };
    expect(expand(grammar, "origin")).toBe(expand(grammar, "origin"));
  });

  it("variant seeds can yield different picks", () => {
    const grammar = { origin: ["one", "two", "three", "four", "five", "six", "seven", "eight"] };
    const seen = new Set(
      Array.from({ length: 24 }, (_, i) => expand(grammar, "origin", { seed: `s${i}` })),
    );
    // Hash-based pickers spread across alternatives; a single fixed pick would be suspicious.
    expect(seen.size).toBeGreaterThan(1);
  });

  it("same seed gives the same pick", () => {
    const grammar = { origin: ["one", "two", "three"] };
    expect(expand(grammar, "origin", { seed: "fixed" })).toBe(
      expand(grammar, "origin", { seed: "fixed" }),
    );
  });

  it("produces no leftover sub-symbol brackets", () => {
    const grammar = {
      origin: "#greet# #name.capitalize#, #stack#",
      greet: ["Halo"],
      name: ["abdul"],
      stack: ["#a#/#b#"],
      a: ["AI"],
      b: ["ML"],
    };
    expect(expand(grammar, "origin")).not.toMatch(/#/);
  });

  it("preserves whitespace and punctuation", () => {
    const grammar = { origin: "  spaced , ; : ! ? 'quoted'  " };
    expect(expand(grammar, "origin")).toBe("  spaced , ; : ! ? 'quoted'  ");
  });
});

describe("createTracery", () => {
  it("binds the grammar and expands via generate()", () => {
    const tracery = createTracery({ origin: "#stack# engineer", stack: ["AI/ML"] });
    expect(tracery("origin")).toBe("AI/ML engineer");
  });

  it("accepts a per-call seed", () => {
    const grammar = { origin: ["a", "b", "c"] };
    const tracery = createTracery(grammar);
    expect(tracery("origin", "seed-1")).toBe(tracery("origin", "seed-1"));
  });

  it("uses a custom pick function when provided", () => {
    const customPick = (alternatives: string[]) => alternatives[alternatives.length - 1];
    const tracery = createTracery({ origin: ["first", "last"] }, { pick: customPick });
    expect(tracery("origin")).toBe("last");
  });
});
