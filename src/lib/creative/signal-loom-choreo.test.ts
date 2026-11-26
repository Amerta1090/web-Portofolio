import { describe, expect, it } from "vitest";
import type { SignalLoomGraph } from "./signal-loom";
import {
  LIGHT_RUN_SECONDS,
  LIGHT_RUN_STAGGER_SECONDS,
  choreographyMode,
  lightRunSchedule,
} from "./signal-loom-choreo";

const GRAPH: SignalLoomGraph = {
  nodes: [],
  edges: [
    { id: "e1", from: "a", to: "z", label: "one", weight: 1 },
    { id: "e2", from: "b", to: "z", label: "two", weight: 1 },
    { id: "e3", from: "c", to: "z", label: "three", weight: 1 },
    { id: "e4", from: "d", to: "z", label: "four", weight: 1 },
    { id: "e5", from: "e", to: "z", label: "five", weight: 1 },
    { id: "e6", from: "f", to: "other", label: "six", weight: 1 },
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

describe("lightRunSchedule (MOTION-21)", () => {
  it("runs along every edge of the selection, uncapped", () => {
    expect(lightRunSchedule(GRAPH, "z").map((run) => run.edge.id)).toEqual([
      "e1",
      "e2",
      "e3",
      "e4",
      "e5",
    ]);
  });

  it("puts the strongest tie first, then node order", () => {
    const graph: SignalLoomGraph = {
      nodes: [
        { id: "cap", label: "Cap", kind: "capability", summary: "" },
        { id: "p1", label: "P1", kind: "project", summary: "" },
        { id: "p2", label: "P2", kind: "project", summary: "" },
        { id: "p3", label: "P3", kind: "project", summary: "" },
      ],
      edges: [
        { id: "c-p3", from: "cap", to: "p3", label: "", weight: 1 },
        { id: "c-p1", from: "cap", to: "p1", label: "", weight: 1 },
        { id: "c-p2", from: "cap", to: "p2", label: "", weight: 2 },
      ],
      defaultNodeId: "cap",
    };
    const runs = lightRunSchedule(graph, "cap");
    expect(runs.map((run) => run.targetId)).toEqual(["p2", "p1", "p3"]);
    expect(runs.every((run) => !run.reversed)).toBe(true);
  });

  it("reverses the run when the selection is the edge's `to` end", () => {
    const runs = lightRunSchedule(GRAPH, "z");
    expect(runs.map((run) => run.targetId)).toEqual(["a", "b", "c", "d", "e"]);
    expect(runs.every((run) => run.reversed)).toBe(true);
  });

  it("schedules arrival as delay + run time, a stagger apart", () => {
    const runs = lightRunSchedule(GRAPH, "z");
    runs.forEach((run, index) => {
      expect(run.delay).toBeCloseTo(index * LIGHT_RUN_STAGGER_SECONDS, 3);
      expect(run.arrive).toBeCloseTo(run.delay + LIGHT_RUN_SECONDS, 3);
    });
  });

  it("returns an empty schedule for an unknown or empty selection", () => {
    expect(lightRunSchedule(GRAPH, "missing")).toEqual([]);
    expect(lightRunSchedule(GRAPH, "")).toEqual([]);
  });
});
