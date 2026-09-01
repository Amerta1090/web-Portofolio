import { describe, expect, it } from "vitest";
import type { Project } from "../../types/projects";
import {
  categoryCounts,
  categorySkillMatrix,
  complexityScore,
  indexProjects,
  keywordSignals,
  perYearStats,
  skillCounts,
  skillPairs,
} from "./metrics";

function p(partial: Partial<Project> & Pick<Project, "title">): Project {
  const { title, ...rest } = partial;
  return {
    period: "Jan 2025 – Feb 2025",
    description: "",
    links: [],
    skills: [],
    ...rest,
    title,
  };
}

const SAMPLE: Project[] = [
  p({
    title: "A",
    category: "ml",
    period: "Jan 2025 – Mar 2025",
    skills: ["Python", "ML", "API"],
    links: [{ label: "gh", url: "https://github.com/amerta/a" }],
  }),
  p({
    title: "B",
    category: "ml",
    period: "Jun 2025 – Jul 2025",
    skills: ["Python", "ML"],
    media: ["proto"],
    description: "build a model to forecast values",
  }),
  p({
    title: "C",
    category: "web",
    period: "Aug 2025 – Aug 2025",
    skills: ["TypeScript", "React"],
  }),
  p({
    title: "D",
    category: "iot",
    period: "Jan 2026 – Present",
    skills: ["Python", "ESP", "Sensor"],
    association: "Campus",
    images: ["/i/p.png", "/i/q.png"],
  }),
];

describe("categoryCounts", () => {
  it("counts and shares by category, sorted by key", () => {
    const out = categoryCounts(SAMPLE, []);
    expect(out).toHaveLength(3);
    expect(out.map((c) => c.category)).toEqual(["iot", "ml", "web"]);
    const ml = out.find((c) => c.category === "ml")!;
    expect(ml.count).toBe(2);
    expect(ml.share).toBeCloseTo(0.5);
    expect(ml.label).toBe("Machine Learning");
  });
});

describe("skillCounts", () => {
  it("ranks skills by count desc, tie by key", () => {
    const out = skillCounts(SAMPLE);
    expect(out[0].skill).toBe("Python");
    expect(out[0].count).toBe(3);
    expect(out[0].categories).toBe(2); // ml + iot
  });

  it("is deterministic across calls", () => {
    expect(skillCounts(SAMPLE)).toEqual(skillCounts(SAMPLE));
  });
});

describe("skillPairs", () => {
  it("finds co-occurring pairs ranked by frequency", () => {
    const out = skillPairs(SAMPLE);
    const pythonMl = out.find((x) => x.a === "ML" && x.b === "Python");
    expect(pythonMl).toBeDefined();
    expect(pythonMl!.count).toBe(2);
    expect(out[0].count).toBeGreaterThanOrEqual(pythonMl!.count);
  });
});

describe("categorySkillMatrix", () => {
  it("builds a matrix with correct cell counts", () => {
    const { categories, skills, cells } = categorySkillMatrix(SAMPLE);
    expect(categories).toEqual(["iot", "ml", "web"]);
    expect(skills).toContain("Python");
    const pyMl = cells.find((c) => c.category === "ml" && c.skill === "Python");
    expect(pyMl!.count).toBe(2);
  });
});

describe("complexityScore", () => {
  it("reproduces the proxy from observable fields only", () => {
    const d = complexityScore(SAMPLE[3]);
    expect(d.breadth).toBe(3);
    expect(d.media).toBe(0);
    expect(d.images).toBe(2);
    expect(d.hasAssociation).toBe(1);
    expect(d.score).toBe(6);
  });
});

describe("perYearStats", () => {
  it("buckets by start year with deterministic ordering", () => {
    const stats = perYearStats(SAMPLE, complexityScore);
    expect(stats.map((s) => s.year)).toEqual([2025, 2026]);
    expect(stats[0].projects).toBe(3);
    expect(stats[1].projects).toBe(1);
  });

  it("computes cumulative and first-seen skills", () => {
    const stats = perYearStats(SAMPLE, complexityScore);
    // 2026 new skills: ESP, Sensor (Python already seen in 2025)
    expect(stats[1].newSkills).toEqual(["ESP", "Sensor"]);
    expect(stats[0].cumulativeSkills).toBeLessThan(stats[1].cumulativeSkills);
    // Python counted once in cumulative total across years
    const all = new Set(SAMPLE.flatMap((x) => x.skills));
    expect(stats[stats.length - 1].cumulativeSkills).toBe(all.size);
  });
});

describe("keywordSignals", () => {
  it("counts projects by matching keyword groups", () => {
    const out = keywordSignals(SAMPLE);
    const ml = out.find((s) => s.group === "machine learning");
    expect(ml!.projects).toBeGreaterThanOrEqual(1); // project B mentions "model"
  });
});

describe("indexProjects", () => {
  it("slugifies titles and extracts repo handles", () => {
    const idx = indexProjects(SAMPLE);
    expect(idx[0].slug).toBe("a");
    expect(idx[0].repoHandle).toBe("amerta/a");
    expect(idx[2].repoHandle).toBeNull();
  });
});
