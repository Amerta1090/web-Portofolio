import { describe, expect, it } from "vitest";
import type { Project } from "../../types/projects";
import { timelineGeometry } from "./visual";

function p(partial: Partial<Project> & Pick<Project, "title" | "period">): Project {
  const { title, period, ...rest } = partial;
  return {
    description: "",
    links: [],
    skills: [],
    ...rest,
    title,
    period,
  };
}

describe("timelineGeometry", () => {
  it("assigns base y positions when nodes are far apart", () => {
    const nodes = timelineGeometry([
      p({ title: "A", category: "ml", period: "Jan 2020 – Jan 2021" }),
      p({ title: "B", category: "web", period: "Jun 2022 – Jul 2022" }),
    ]).nodes;

    expect(nodes[0].labelY).toBe(122); // even index → above
    expect(nodes[1].labelY).toBe(192); // odd index → below
  });

  it("pushes colliding labels on the same side apart", () => {
    // 4 projects starting the same month → dense cluster forcing pushes.
    const nodes = timelineGeometry([
      p({ title: "A", category: "ml", period: "Jan 2021 – Jan 2021" }),
      p({ title: "B", category: "web", period: "Jan 2021 – Jan 2021" }),
      p({ title: "C", category: "iot", period: "Jan 2021 – Jan 2021" }),
      p({ title: "D", category: "cli", period: "Jan 2021 – Jan 2021" }),
    ]).nodes;

    // Same side, same x → must be separated by at least the push step vertically.
    const sameXSides: Record<number, number[]> = { above: [], below: [] };
    for (let i = 0; i < nodes.length; i++) {
      const side = i % 2 === 0 ? "above" : "below";
      sameXSides[side].push(nodes[i].labelY);
    }
    for (const side of ["above", "below"] as const) {
      const ys = sameXSides[side].sort((a, b) => a - b);
      for (let i = 1; i < ys.length; i++) {
        expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(20);
      }
    }
  });

  it("keeps the axis at 156 and labels above above / below below", () => {
    const geom = timelineGeometry([
      p({ title: "A", category: "ml", period: "Jan 2020 – Jan 2021" }),
      p({ title: "B", category: "web", period: "Jan 2022 – Jan 2023" }),
    ]);
    expect(geom.nodes[0].labelY).toBeLessThan(156);
    expect(geom.nodes[1].labelY).toBeGreaterThan(156);
  });

  it("never lets a label exceed the canvas bounds", () => {
    const geom = timelineGeometry([
      p({ title: "A", category: "ml", period: "Jan 2021 – Jan 2021" }),
      p({ title: "B", category: "web", period: "Jan 2021 – Jan 2021" }),
      p({ title: "C", category: "iot", period: "Jan 2021 – Jan 2021" }),
      p({ title: "D", category: "cli", period: "Jan 2021 – Jan 2021" }),
      p({ title: "E", category: "devops", period: "Jan 2021 – Jan 2021" }),
      p({ title: "F", category: "ml", period: "Jan 2021 – Jan 2021" }),
    ]);
    for (const n of geom.nodes) {
      expect(n.labelY).toBeGreaterThanOrEqual(28);
      expect(n.labelY).toBeLessThanOrEqual(246);
      expect(n.labelY).toBeLessThan(geom.height);
    }
  });
});
