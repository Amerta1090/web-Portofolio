import { describe, it, expect } from "vitest";
import { caseStudySchema, type CaseStudyData } from "../schema";

function validData(overrides: Partial<CaseStudyData> = {}): CaseStudyData {
  return {
    title: "Test Project",
    summary: "A test summary.",
    role: "Engineer",
    stack: ["TypeScript", "React"],
    period: "Jan 2025 – Jun 2025",
    metrics: [{ label: "Latency", value: "< 100ms" }],
    ...overrides,
  };
}

describe("caseStudySchema", () => {
  it("validates correct data", () => {
    const result = caseStudySchema.safeParse(validData());
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const { title, ...rest } = validData();
    const result = caseStudySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing summary", () => {
    const { summary, ...rest } = validData();
    const result = caseStudySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing role", () => {
    const { role, ...rest } = validData();
    const result = caseStudySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing stack", () => {
    const { stack, ...rest } = validData();
    const result = caseStudySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing metrics", () => {
    const { metrics, ...rest } = validData();
    const result = caseStudySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("defaults featured to false", () => {
    const result = caseStudySchema.safeParse(validData());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.featured).toBe(false);
    }
  });

  it("defaults order to 0", () => {
    const result = caseStudySchema.safeParse(validData());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.order).toBe(0);
    }
  });

  it("accepts valid category values", () => {
    for (const cat of ["ai-ml", "iot", "web", "systems"] as const) {
      const result = caseStudySchema.safeParse(validData({ category: cat }));
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid category", () => {
    const result = caseStudySchema.safeParse(validData({ category: "mobile" as any }));
    expect(result.success).toBe(false);
  });

  it("preserves provided featured and order values", () => {
    const result = caseStudySchema.safeParse(validData({ featured: true, order: 5 }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.featured).toBe(true);
      expect(result.data.order).toBe(5);
    }
  });

  it("validates metrics array items", () => {
    const result = caseStudySchema.safeParse(
      validData({
        metrics: [
          { label: "A", value: "1" },
          { label: "B", value: "2" },
        ],
      }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metrics).toHaveLength(2);
    }
  });

  it("rejects metrics with missing label", () => {
    const result = caseStudySchema.safeParse(
      validData({ metrics: [{ value: "1" } as any] }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts empty stack array", () => {
    const result = caseStudySchema.safeParse(validData({ stack: [] }));
    expect(result.success).toBe(true);
  });
});
