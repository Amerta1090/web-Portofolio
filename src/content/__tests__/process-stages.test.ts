import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { PROCESS_STAGE_IDS, caseStudySchema, processStageSchema } from "../schema";
import type { ProcessStage } from "../schema";

/** Input shape: defaults such as `featured`/`order` are optional before parsing. */
type CaseStudyInput = z.input<typeof caseStudySchema>;

function baseData(overrides: Partial<CaseStudyInput> = {}): CaseStudyInput {
  return {
    title: "Test Case Study",
    summary: "A test summary.",
    role: "ML Engineer",
    stack: ["Python"],
    period: "Jan 2025 – Jun 2025",
    metrics: [{ label: "Latency", value: "5.93s" }],
    ...overrides,
  };
}

function stage(overrides: Partial<ProcessStage> & { id: string }): ProcessStage {
  return {
    label: overrides.id,
    summary: `summary for ${overrides.id}`,
    evidence: `evidence for ${overrides.id}`,
    ...overrides,
  };
}

const completeStages: ProcessStage[] = PROCESS_STAGE_IDS.map((id) => stage({ id }));

describe("processStageSchema", () => {
  it("accepts the canonical five stages with metric and diagram metadata", () => {
    const result = processStageSchema.safeParse({
      id: "model",
      label: "Model",
      summary: "Fusion over BM25 and E5.",
      evidence: "Reciprocal rank fusion outperformed either path alone.",
      metric: { label: "Generator", value: "LLaMA 3.2 3B" },
      diagram: {
        type: "flow",
        caption: "Two retrieval paths fused.",
        nodes: [
          { id: "bm25", label: "BM25", note: "sparse" },
          { id: "e5", label: "E5 multilingual" },
        ],
        edges: [["bm25", "e5"]],
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metric?.value).toBe("LLaMA 3.2 3B");
      expect(result.data.diagram?.nodes).toHaveLength(2);
      expect(result.data.diagram?.edges[0]).toEqual(["bm25", "e5"]);
    }
  });

  it("accepts a stage with only the required fields", () => {
    expect(processStageSchema.safeParse(stage({ id: "problem" })).success).toBe(true);
  });

  it("rejects a stage without id, label, summary, or evidence", () => {
    const full = stage({ id: "problem" });
    for (const field of ["id", "label", "summary", "evidence"] as const) {
      const { [field]: _omitted, ...rest } = full;
      expect(processStageSchema.safeParse(rest).success).toBe(false);
    }
  });

  it("rejects empty required strings", () => {
    expect(processStageSchema.safeParse(stage({ id: "problem", summary: "" })).success).toBe(false);
  });

  it("rejects a metric without a label or value", () => {
    expect(
      processStageSchema.safeParse(stage({ id: "impact", metric: { value: "0.972" } as never }))
        .success,
    ).toBe(false);
  });

  it("rejects a diagram with fewer than two nodes", () => {
    expect(
      processStageSchema.safeParse(
        stage({
          id: "model",
          diagram: { type: "flow", nodes: [{ id: "a", label: "A" }], edges: [] },
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects an unknown diagram type", () => {
    expect(
      processStageSchema.safeParse(
        stage({
          id: "model",
          diagram: {
            type: "orbit",
            nodes: [
              { id: "a", label: "A" },
              { id: "b", label: "B" },
            ],
          },
        } as never),
      ).success,
    ).toBe(false);
  });
});

describe("caseStudySchema processStages", () => {
  it("stays valid when process stages are absent", () => {
    const result = caseStudySchema.safeParse(baseData());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.processStages).toBeUndefined();
    }
  });

  it("accepts a complete five-stage case study", () => {
    const result = caseStudySchema.safeParse(baseData({ processStages: completeStages }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.processStages).toHaveLength(5);
    }
  });

  it("rejects the whole case study when one stage is malformed", () => {
    const result = caseStudySchema.safeParse(
      baseData({
        processStages: [...completeStages, stage({ id: "impact", evidence: "" })],
      }),
    );
    expect(result.success).toBe(false);
  });
});
