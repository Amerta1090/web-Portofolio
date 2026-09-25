import { describe, expect, it } from "vitest";
import type { SignalLoomGraph } from "./signal-loom";
import {
  SIGNAL_HASH_PREFIX,
  activeEdgeIds,
  parseSignalHash,
  rovingTargetIndex,
} from "./signal-loom-select";

const VALID_IDS = ["capability-ml", "capability-web", "project-a"] as const;

const GRAPH: SignalLoomGraph = {
  nodes: [],
  edges: [
    { id: "capability-ml->project-a", from: "capability-ml", to: "project-a", label: "ml" },
    { id: "capability-web->project-a", from: "capability-web", to: "project-a", label: "web" },
    { id: "capability-ml->project-b", from: "capability-ml", to: "project-b", label: "ml" },
  ],
  defaultNodeId: "project-a",
};

describe("parseSignalHash", () => {
  it("returns the fallback for an empty or non-signal hash", () => {
    expect(parseSignalHash("", VALID_IDS, "project-a")).toBe("project-a");
    expect(parseSignalHash("#about", VALID_IDS, "project-a")).toBe("project-a");
    expect(parseSignalHash("signal-project-a", VALID_IDS, "project-a")).toBe("project-a");
  });

  it("parses a valid node id from the hash", () => {
    expect(parseSignalHash(`${SIGNAL_HASH_PREFIX}capability-ml`, VALID_IDS, "project-a")).toBe(
      "capability-ml",
    );
  });

  it("falls back for an unknown or empty node id", () => {
    expect(parseSignalHash(`${SIGNAL_HASH_PREFIX}unknown-node`, VALID_IDS, "project-a")).toBe(
      "project-a",
    );
    expect(parseSignalHash(`${SIGNAL_HASH_PREFIX}`, VALID_IDS, "project-a")).toBe("project-a");
  });

  it("does not match ids that are only suffixes of the hash", () => {
    expect(parseSignalHash(`${SIGNAL_HASH_PREFIX}not-capability-ml`, VALID_IDS, "project-a")).toBe(
      "project-a",
    );
  });
});

describe("rovingTargetIndex", () => {
  it("returns -1 for an empty list", () => {
    expect(rovingTargetIndex(0, 0, "ArrowRight")).toBe(-1);
    expect(rovingTargetIndex(0, 0, "Home")).toBe(-1);
    expect(rovingTargetIndex(0, 0, "End")).toBe(-1);
  });

  it("moves forward and wraps around", () => {
    expect(rovingTargetIndex(0, 3, "ArrowRight")).toBe(1);
    expect(rovingTargetIndex(2, 3, "ArrowRight")).toBe(0);
    expect(rovingTargetIndex(2, 3, "ArrowDown")).toBe(0);
  });

  it("moves backward and wraps around", () => {
    expect(rovingTargetIndex(1, 3, "ArrowLeft")).toBe(0);
    expect(rovingTargetIndex(0, 3, "ArrowLeft")).toBe(2);
    expect(rovingTargetIndex(0, 3, "ArrowUp")).toBe(2);
  });

  it("jumps to first and last", () => {
    expect(rovingTargetIndex(1, 3, "Home")).toBe(0);
    expect(rovingTargetIndex(0, 3, "End")).toBe(2);
  });

  it("recovers a lost current selection to the first node", () => {
    expect(rovingTargetIndex(-1, 3, "ArrowRight")).toBe(0);
    expect(rovingTargetIndex(-1, 3, "ArrowLeft")).toBe(0);
  });
});

describe("activeEdgeIds", () => {
  it("collects edges where the node is either endpoint", () => {
    const ids = activeEdgeIds(GRAPH, "capability-ml");
    expect(ids).toEqual(new Set(["capability-ml->project-a", "capability-ml->project-b"]));
  });

  it("handles nodes with no edges and unknown ids", () => {
    expect(activeEdgeIds(GRAPH, "project-b").size).toBe(1);
    expect(activeEdgeIds(GRAPH, "capability-unknown").size).toBe(0);
  });

  it("handles an empty graph", () => {
    expect(activeEdgeIds({ nodes: [], edges: [], defaultNodeId: "" }, "x").size).toBe(0);
  });
});
