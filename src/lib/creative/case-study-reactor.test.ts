import { describe, expect, it } from "vitest";
import type { ProcessStage, ProcessStageDiagram } from "../../content/schema";
import {
  buildStageViews,
  normalizeProcessStages,
  normalizeStageDiagram,
  orderStageIds,
  processStagesOf,
  stageAnchorId,
} from "./case-study-reactor";

function stage(overrides: Partial<ProcessStage> & { id: string }): ProcessStage {
  return {
    label: overrides.id,
    summary: `summary for ${overrides.id}`,
    evidence: `evidence for ${overrides.id}`,
    ...overrides,
  };
}

describe("orderStageIds", () => {
  it("sorts the canonical five into narrative order", () => {
    expect(orderStageIds(["impact", "system", "data", "problem", "model"])).toEqual([
      "problem",
      "data",
      "model",
      "system",
      "impact",
    ]);
  });

  it("keeps only the ids it was given", () => {
    expect(orderStageIds(["model", "problem"])).toEqual(["problem", "model"]);
  });

  it("appends custom ids after the canonical five in authored order", () => {
    expect(orderStageIds(["retrospective", "problem", "deployment", "impact"])).toEqual([
      "problem",
      "impact",
      "retrospective",
      "deployment",
    ]);
  });

  it("collapses duplicate ids", () => {
    expect(orderStageIds(["problem", "problem", "impact"])).toEqual(["problem", "impact"]);
  });
});

describe("normalizeProcessStages", () => {
  it("returns an empty list for missing data", () => {
    expect(normalizeProcessStages(undefined)).toEqual([]);
    expect(normalizeProcessStages([])).toEqual([]);
  });

  it("returns stages in canonical order regardless of authored order", () => {
    const stages = [stage({ id: "impact" }), stage({ id: "problem" }), stage({ id: "model" })];
    expect(normalizeProcessStages(stages).map((s) => s.id)).toEqual(["problem", "model", "impact"]);
  });

  it("keeps the first stage when an id repeats", () => {
    const stages = [
      stage({ id: "problem", summary: "first" }),
      stage({ id: "problem", summary: "second" }),
    ];
    const normalized = normalizeProcessStages(stages);
    expect(normalized).toHaveLength(1);
    expect(normalized[0]?.summary).toBe("first");
  });

  it("drops stages without a usable id, label, or summary", () => {
    const stages = [
      stage({ id: "problem" }),
      { id: "", label: "Broken", summary: "s", evidence: "e" } as ProcessStage,
      { id: "data", label: "", summary: "s", evidence: "e" } as ProcessStage,
      { id: "model", label: "Model", summary: "", evidence: "e" } as ProcessStage,
    ];
    expect(normalizeProcessStages(stages).map((s) => s.id)).toEqual(["problem"]);
  });

  it("is deterministic for the same input", () => {
    const stages = [stage({ id: "system" }), stage({ id: "data" })];
    expect(normalizeProcessStages(stages)).toEqual(normalizeProcessStages(stages));
  });
});

describe("processStagesOf", () => {
  it("returns null when a case study has no stages", () => {
    expect(processStagesOf({})).toBeNull();
    expect(processStagesOf({ processStages: [] })).toBeNull();
  });

  it("returns ordered stages when present", () => {
    const result = processStagesOf({
      processStages: [stage({ id: "impact" }), stage({ id: "problem" })],
    });
    expect(result?.map((s) => s.id)).toEqual(["problem", "impact"]);
  });
});

describe("stageAnchorId", () => {
  it("builds a stable deep-link target", () => {
    expect(stageAnchorId("problem")).toBe("stage-problem");
    expect(stageAnchorId("Hybrid Retrieval")).toBe("stage-hybrid-retrieval");
  });
});

describe("normalizeStageDiagram", () => {
  const diagram: ProcessStageDiagram = {
    type: "flow",
    caption: "Ingestion",
    nodes: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
      { id: "c", label: "C" },
    ],
    edges: [
      ["a", "b"],
      ["b", "c"],
    ],
  };

  it("returns null when there is no diagram", () => {
    expect(normalizeStageDiagram(undefined)).toBeNull();
  });

  it("keeps node order, caption, and valid edges", () => {
    const result = normalizeStageDiagram(diagram);
    expect(result?.nodes.map((n) => n.id)).toEqual(["a", "b", "c"]);
    expect(result?.caption).toBe("Ingestion");
    expect(result?.edges).toEqual([
      { from: "a", to: "b" },
      { from: "b", to: "c" },
    ]);
  });

  it("deduplicates repeated node ids", () => {
    const result = normalizeStageDiagram({
      type: "flow",
      nodes: [
        { id: "a", label: "A" },
        { id: "a", label: "A again" },
        { id: "b", label: "B" },
      ],
      edges: [["a", "b"]],
    });
    expect(result?.nodes).toHaveLength(2);
    expect(result?.nodes[0]?.label).toBe("A");
  });

  it("drops edges that point at unknown nodes or the node itself", () => {
    const result = normalizeStageDiagram({
      type: "flow",
      nodes: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
      edges: [
        ["a", "b"],
        ["b", "missing"],
        ["a", "a"],
      ],
    });
    expect(result?.edges).toEqual([{ from: "a", to: "b" }]);
  });

  it("returns null when fewer than two renderable nodes remain", () => {
    expect(
      normalizeStageDiagram({
        type: "flow",
        nodes: [
          { id: "a", label: "A" },
          { id: "a", label: "A again" },
        ],
        edges: [],
      }),
    ).toBeNull();
  });
});

describe("buildStageViews", () => {
  it("numbers stages, exposes anchors, and keeps absent metric/diagram as null", () => {
    const views = buildStageViews([
      stage({ id: "problem" }),
      stage({
        id: "impact",
        metric: { label: "Context Relevance", value: "0.972" },
      }),
    ]);

    expect(views).toHaveLength(2);
    expect(views[0]?.ordinal).toBe("01");
    expect(views[0]?.positionLabel).toBe("Stage 1 of 2");
    expect(views[0]?.anchorId).toBe("stage-problem");
    expect(views[0]?.metric).toBeNull();
    expect(views[0]?.diagram).toBeNull();
    expect(views[1]?.ordinal).toBe("02");
    expect(views[1]?.metric).toEqual({ label: "Context Relevance", value: "0.972" });
  });

  it("pads ordinals past nine and stays deterministic", () => {
    const stages = Array.from({ length: 10 }, (_, i) => stage({ id: `stage-${i}` }));
    const views = buildStageViews(stages);
    expect(views[9]?.ordinal).toBe("10");
    expect(views.map((v) => v.ordinal)).toEqual(views.map((v) => v.ordinal));
  });

  it("returns an empty list for an empty stage list", () => {
    expect(buildStageViews([])).toEqual([]);
  });
});
