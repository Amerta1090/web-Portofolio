import { describe, expect, it } from "vitest";
import type { ProcessStage, ProcessStageDiagram } from "../../content/schema";
import {
  buildStageViews,
  flowDiagramGeometry,
  normalizeProcessStages,
  normalizeStageDiagram,
  orderStageIds,
  parseStageHash,
  processStagesOf,
  stageAnchorId,
  wrapDiagramText,
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

describe("parseStageHash", () => {
  const ids = ["problem", "data", "impact"];

  it("resolves a matching stage deep link", () => {
    expect(parseStageHash("#stage-data", ids, "problem")).toBe("data");
  });

  it("resolves the anchor slug of a stage id with punctuation", () => {
    expect(parseStageHash("#stage-hybrid-retrieval", ["Hybrid Retrieval"], "problem")).toBe(
      "Hybrid Retrieval",
    );
  });

  it("keeps the current stage for foreign, empty, or unknown hashes", () => {
    expect(parseStageHash("#process", ids, "problem")).toBe("problem");
    expect(parseStageHash("#stage-", ids, "problem")).toBe("problem");
    expect(parseStageHash("#stage-nope", ids, "problem")).toBe("problem");
    expect(parseStageHash("", ids, "problem")).toBe("problem");
  });
});

describe("wrapDiagramText", () => {
  it("wraps on word boundaries without re-ordering or hyphenating", () => {
    expect(wrapDiagramText("Ingestion to two parallel indexes", 12, 4)).toEqual({
      lines: ["Ingestion to", "two parallel", "indexes"],
      truncated: false,
    });
  });

  it("keeps an over-long single word on its own line", () => {
    expect(wrapDiagramText("Reciprocal", 4, 4).lines).toEqual(["Reciprocal"]);
  });

  it("truncates with an ellipsis when the line cap is reached", () => {
    const wrapped = wrapDiagramText("one two three four five six", 8, 2);
    expect(wrapped.lines).toHaveLength(2);
    expect(wrapped.truncated).toBe(true);
    expect(wrapped.lines[1]?.endsWith("…")).toBe(true);
  });

  it("returns no lines for empty or whitespace-only text", () => {
    expect(wrapDiagramText("   ", 10, 3)).toEqual({ lines: [], truncated: false });
  });
});

describe("flowDiagramGeometry", () => {
  const chain: ProcessStageDiagram = {
    type: "flow",
    caption: "One corpus, two indexes.",
    nodes: [
      { id: "pdf", label: "PDF volumes" },
      { id: "extract", label: "Text extraction" },
      { id: "chunk", label: "Chunking" },
      { id: "dense", label: "FAISS index", note: "dense" },
      { id: "sparse", label: "BM25 index", note: "sparse" },
    ],
    edges: [
      ["pdf", "extract"],
      ["extract", "chunk"],
      ["chunk", "dense"],
      ["chunk", "sparse"],
    ],
  };

  it("returns null when there is nothing drawable", () => {
    expect(flowDiagramGeometry(null)).toBeNull();
    expect(flowDiagramGeometry(undefined)).toBeNull();
    expect(
      flowDiagramGeometry({ type: "flow", nodes: [{ id: "a", label: "A" }], edges: [] }),
    ).toBeNull();
  });

  it("layers a fork so both targets share one row", () => {
    const geometry = flowDiagramGeometry(normalizeStageDiagram(chain));
    expect(geometry).not.toBeNull();
    const byId = new Map(geometry?.nodes.map((node) => [node.id, node]));
    expect(byId.get("pdf")?.layer).toBe(0);
    expect(byId.get("extract")?.layer).toBe(1);
    expect(byId.get("chunk")?.layer).toBe(2);
    expect(byId.get("dense")?.layer).toBe(3);
    expect(byId.get("sparse")?.layer).toBe(3);
    expect(byId.get("dense")?.rowCount).toBe(2);
    // A fork means two nodes sit side by side on the same row.
    expect(byId.get("dense")?.row).not.toBe(byId.get("sparse")?.row);
  });

  it("stacks layers downward with a positive height", () => {
    const geometry = flowDiagramGeometry(normalizeStageDiagram(chain));
    expect(geometry?.width).toBe(100);
    expect(geometry?.height).toBeGreaterThan(0);
    const tops = (geometry?.nodes ?? []).map((node) => node.y);
    // y increases with the layer, so the flow always reads top to bottom.
    expect(Math.min(...tops)).toBe(0);
    const layerTops = new Map<number, number>();
    for (const node of geometry?.nodes ?? []) {
      const current = layerTops.get(node.layer);
      if (current === undefined || node.y < current) layerTops.set(node.layer, node.y);
    }
    const ordered = [...layerTops.entries()].sort((a, b) => a[0] - b[0]).map(([, y]) => y);
    for (let i = 1; i < ordered.length; i += 1) {
      expect(ordered[i] as number).toBeGreaterThan(ordered[i - 1] as number);
    }
  });

  it("joins every edge from the source box bottom to the target box top", () => {
    const geometry = flowDiagramGeometry(normalizeStageDiagram(chain));
    const byId = new Map(geometry?.nodes.map((node) => [node.id, node]));
    const edge = geometry?.edges.find((item) => item.id === "extract->chunk");
    const from = byId.get("extract");
    const to = byId.get("chunk");
    expect(edge).toBeDefined();
    expect(edge?.x1).toBeCloseTo((from?.x as number) + (from?.width as number) / 2, 6);
    expect(edge?.y1).toBeCloseTo((from?.y as number) + (from?.height as number), 6);
    expect(edge?.x2).toBeCloseTo((to?.x as number) + (to?.width as number) / 2, 6);
    expect(edge?.y2).toBeCloseTo(to?.y as number, 6);
    expect(geometry?.edges).toHaveLength(4);
  });

  it("staggers nodes and edges by layer so the flow assembles in order", () => {
    const geometry = flowDiagramGeometry(normalizeStageDiagram(chain));
    for (const node of geometry?.nodes ?? []) expect(node.order).toBe(node.layer);
    const extractEdge = geometry?.edges.find((item) => item.id === "extract->chunk");
    expect(extractEdge?.order).toBe(1);
  });

  it("keeps boxes inside the viewBox width", () => {
    const geometry = flowDiagramGeometry(normalizeStageDiagram(chain));
    for (const node of geometry?.nodes ?? []) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x + node.width).toBeLessThanOrEqual(100);
    }
  });

  it("positions label and note baselines inside the node box", () => {
    const geometry = flowDiagramGeometry(normalizeStageDiagram(chain));
    const dense = geometry?.nodes.find((node) => node.id === "dense");
    expect(dense?.labelLines.length).toBeGreaterThan(0);
    expect(dense?.noteLines).toEqual(["dense"]);
    expect(dense?.truncated).toBe(false);
    for (const line of dense?.textLines ?? []) {
      expect(line.baseline).toBeGreaterThan(dense?.y as number);
      expect(line.baseline).toBeLessThanOrEqual((dense?.y as number) + (dense?.height as number));
    }
    expect(dense?.textLines[0]?.kind).toBe("label");
    expect(dense?.textLines[dense.textLines.length - 1]?.kind).toBe("note");
  });

  it("appends unlayerable cycle members as descending tail layers", () => {
    const cyclic = normalizeStageDiagram({
      type: "flow",
      nodes: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
        { id: "c", label: "C" },
      ],
      edges: [
        ["a", "b"],
        ["b", "c"],
        ["c", "a"],
      ],
    });
    const geometry = flowDiagramGeometry(cyclic);
    expect(geometry?.nodes).toHaveLength(3);
    // Every node still gets a box, and the diagram still draws.
    expect(geometry?.height).toBeGreaterThan(0);
    const layers = (geometry?.nodes ?? []).map((node) => node.layer);
    expect(new Set(layers).size).toBe(3);
  });

  it("is deterministic and independent of authored node order", () => {
    const reversed = normalizeStageDiagram({
      type: "flow",
      nodes: [...chain.nodes].reverse(),
      edges: chain.edges,
    });
    const forwardGeometry = flowDiagramGeometry(normalizeStageDiagram(chain));
    const reversedGeometry = flowDiagramGeometry(reversed);
    expect(reversedGeometry?.nodes.map((node) => `${node.id}@${node.layer}`).sort()).toEqual(
      forwardGeometry?.nodes.map((node) => `${node.id}@${node.layer}`).sort(),
    );
    expect(flowDiagramGeometry(normalizeStageDiagram(chain))).toEqual(forwardGeometry);
  });
});
