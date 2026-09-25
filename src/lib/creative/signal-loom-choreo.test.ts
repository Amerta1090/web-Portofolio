import { describe, expect, it } from "vitest";
import type { SignalLoomGraph } from "./signal-loom";
import {
  SIGNAL_MAX_DOTS,
  choreographyMode,
  edgeLength,
  signalDotEdges,
} from "./signal-loom-choreo";

const GRAPH: SignalLoomGraph = {
  nodes: [],
  edges: [
    { id: "e1", from: "a", to: "z", label: "one" },
    { id: "e2", from: "b", to: "z", label: "two" },
    { id: "e3", from: "c", to: "z", label: "three" },
    { id: "e4", from: "d", to: "z", label: "four" },
    { id: "e5", from: "e", to: "z", label: "five" },
    { id: "e6", from: "f", to: "other", label: "six" },
  ],
  defaultNodeId: "z",
};

describe("choreographyMode", () => {
  it("is none when reduced motion is preferred regardless of activity", () => {
    expect(choreographyMode(true, false, 5)).toBe("none");
    expect(choreographyMode(true, true, 5)).toBe("none");
  });

  it("is none when no active edges exist", () => {
    expect(choreographyMode(false, false, 0)).toBe("none");
  });

  it("is static (emphasis only) in low-power mode", () => {
    expect(choreographyMode(false, true, 3)).toBe("static");
  });

  it("is full (draw + travel) in the normal case", () => {
    expect(choreographyMode(false, false, 3)).toBe("full");
  });
});

describe("signalDotEdges", () => {
  it("returns only edges connected to the selected node in graph order", () => {
    expect(signalDotEdges(GRAPH, "z", 10).map((edge) => edge.id)).toEqual([
      "e1",
      "e2",
      "e3",
      "e4",
      "e5",
    ]);
  });

  it("caps simultaneous animated paths at SIGNAL_MAX_DOTS", () => {
    const dots = signalDotEdges(GRAPH, "z");
    expect(dots).toHaveLength(SIGNAL_MAX_DOTS);
    expect(dots.map((edge) => edge.id)).toEqual(["e1", "e2", "e3"]);
  });

  it("respects an explicit smaller cap", () => {
    expect(signalDotEdges(GRAPH, "z", 2)).toHaveLength(2);
  });

  it("returns an empty list for an unknown or empty selection", () => {
    expect(signalDotEdges(GRAPH, "missing")).toEqual([]);
    expect(signalDotEdges(GRAPH, "", 10)).toEqual([]);
  });
});

describe("edgeLength", () => {
  it("computes the euclidean distance between two points", () => {
    expect(edgeLength(0, 0, 3, 4)).toBe(5);
    expect(edgeLength(10, 22, 22, 78)).toBeCloseTo(Math.hypot(12, 56), 10);
  });

  it("is zero for a degenerate edge", () => {
    expect(edgeLength(50, 50, 50, 50)).toBe(0);
  });
});
