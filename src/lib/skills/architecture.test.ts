import { describe, expect, it } from "vitest";
import projectsData from "../../../data/projects.json";
import skillsData from "../../../data/skills.json";
import type { Project } from "../../types/projects";
import type { SkillsData } from "../../types/skills";
import {
  MAX_DEPTH,
  STAGE_DEFINITIONS,
  buildCapabilityArchitecture,
  depthShare,
  mapsEveryCategory,
  normalizeSkill,
  skillsMatch,
  slugify,
  stageName,
  tallyDepth,
} from "./architecture";

const skills = skillsData as SkillsData;
const projects = projectsData.projects as Project[];
const architecture = buildCapabilityArchitecture(skills, projects);

describe("stage coverage", () => {
  it("maps every skill category exactly once", () => {
    expect(mapsEveryCategory(skills)).toBe(true);
  });

  it("keeps all 8 categories and every declared skill row", () => {
    const declared = skills.categories.length;
    const mapped = architecture.stages.flatMap((stage) => stage.areas);
    expect(mapped).toHaveLength(declared);
    // Rows, not capabilities: this asserts nothing was dropped in transit.
    expect(architecture.totalSkillRows).toBe(
      skills.categories.reduce((sum, category) => sum + category.skills.length, 0),
    );
  });

  it("counts capabilities, not rows, when a skill sits in two categories", () => {
    // `skills.json` files JavaScript under both Web Development and Programming
    // Languages — 51 rows, 50 capabilities. Reporting 51 would be a number the
    // data does not support, and would disagree with the areas printed below it.
    const rows = skills.categories.reduce((sum, c) => sum + c.skills.length, 0);
    expect(architecture.totalSkillRows).toBe(rows);
    expect(architecture.totalSkills).toBe(rows - 1);

    // The invariant that would have caught it: stages partition the total.
    expect(architecture.stages.reduce((sum, s) => sum + s.skillCount, 0)).toBe(
      architecture.totalSkills,
    );
    // And the stage that owns both copies admits it in its own rows count.
    const build = architecture.stages.find((s) => s.id === "build");
    expect(build?.skillRows).toBe((build?.skillCount ?? 0) + 1);
  });

  it("preserves the declared reading order", () => {
    expect(architecture.stages.map((stage) => stage.id)).toEqual([
      "sense",
      "model",
      "build",
      "operate",
    ]);
    expect(architecture.stages.map((stage) => stage.index)).toEqual([1, 2, 3, 4]);
  });

  it("drops an unresolvable category instead of rendering an empty stage", () => {
    const broken: SkillsData = { categories: skills.categories.slice(0, 2) };
    const result = buildCapabilityArchitecture(broken, projects);
    // The six categories with no entry simply do not appear; the stage survives.
    expect(result.stages).toHaveLength(STAGE_DEFINITIONS.length);
    expect(result.stages[0].areas).toHaveLength(0);
    expect(result.stages[0].skillCount).toBe(0);
    expect(result.stages[0].projectCount).toBe(0);
  });
});

describe("skillsMatch", () => {
  it("matches a label written with and without its parenthetical", () => {
    expect(skillsMatch("Python (Programming Language)", "Python")).toBe(true);
    expect(normalizeSkill("Progressive Web Applications (PWAs)")).toBe(
      "progressive web applications",
    );
  });

  it("collapses case, punctuation, and repeated whitespace", () => {
    expect(skillsMatch("  machine   learning ", "Machine Learning")).toBe(true);
    expect(skillsMatch("Time-Series Forecasting", "Time Series Forecasting")).toBe(true);
  });

  it("refuses substring matches, which produced a false back-end claim", () => {
    // The rejected containment rule credited a front-end Astro portfolio to
    // "Back-End Web Development" through the shared words "web development".
    expect(skillsMatch("Web Development", "Back-End Web Development")).toBe(false);
    expect(skillsMatch("AI", "Chai")).toBe(false);
    expect(skillsMatch("MLOps", "ML")).toBe(false);
  });

  it("does not link areas through an incidental shared word", () => {
    // The rejected token rule reported these two as related. They are not.
    expect(skillsMatch("Recommender Systems", "Embedded Systems")).toBe(false);
    expect(skillsMatch("Data Engineering", "Automation")).toBe(false);
  });

  it("rejects empty input rather than matching two blanks", () => {
    expect(skillsMatch("", "Python")).toBe(false);
    expect(skillsMatch("Python", "")).toBe(false);
    expect(skillsMatch("", "")).toBe(false);
  });
});

describe("depth tallies", () => {
  it("counts each level and pre-seeds the full 1-5 range", () => {
    expect(tallyDepth([{ depth: 5 }, { depth: 3 }, { depth: 3 }])).toEqual({
      5: 1,
      4: 0,
      3: 2,
      2: 0,
      1: 0,
    });
  });

  it("ignores out-of-range levels", () => {
    expect(tallyDepth([{ depth: 0 }, { depth: 9 }])).toEqual({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  });

  it("names only skills at the scale's top level as deepest", () => {
    const iot = architecture.stages[0].areas[0];
    expect(iot.name).toBe("IoT & Embedded Systems");
    // IoT tops out at 4/5, so nothing is claimed as deepest.
    expect(iot.deepest).toHaveLength(0);

    const dataScience = architecture.stages[1].areas[1];
    expect(dataScience.name).toBe("Data Science & Analytics");
    expect(dataScience.deepest.map((skill) => skill.name)).toEqual([
      "Data Science",
      "Data Analysis",
    ]);
  });

  it("computes a depth share defensively at zero", () => {
    expect(depthShare({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, 0)).toBe(0);
  });
});

describe("the deepest line", () => {
  it("names only skills that actually reach the top of the scale", () => {
    // Anchored to MAX_DEPTH, not to each area's own best: 51 skills spread only
    // across levels 3-5, so anchoring locally would print "Deepest" on all 8
    // areas and the line would carry no information at all.
    const withDeepest = architecture.stages.flatMap((stage) =>
      stage.areas.filter((area) => area.deepest.length > 0),
    );
    const areas = architecture.stages.flatMap((stage) => stage.areas);
    expect(areas).toHaveLength(8);
    expect(withDeepest.length).toBe(4);

    for (const area of areas) {
      for (const skill of area.deepest) expect(skill.depth).toBe(MAX_DEPTH);
    }
  });

  it("leaves the line empty for areas that top out below the scale maximum", () => {
    // Three areas stop at 4/5, so claiming a deepest skill for them would be
    // padding. The page omits the line instead.
    const capped = architecture.stages
      .flatMap((stage) => stage.areas)
      .filter((area) => area.deepest.length === 0);
    expect(capped).toHaveLength(4);
    for (const area of capped) {
      expect(Math.max(...area.skills.map((skill) => skill.depth))).toBeLessThan(MAX_DEPTH);
    }
  });
});

describe("project evidence", () => {
  const buildAreas = ["Programming Languages", "Web Development"];

  it("never counts a project twice inside one stage", () => {
    // "Red Devil Dynamics" matches both Web Development and Programming
    // Languages, so the naive sum of two areas would double-count it.
    const build = architecture.stages.find((stage) => stage.id === "build");
    expect(build).toBeDefined();
    const categories = skills.categories.filter((category) => buildAreas.includes(category.name));
    expect(categories).toHaveLength(buildAreas.length);

    const expected = projects.filter((project) =>
      categories.some((category) =>
        category.skills.some((skill) =>
          (project.skills ?? []).some((s) => skillsMatch(s, skill.name)),
        ),
      ),
    ).length;

    if (!build) throw new Error("build stage missing");
    expect(build.projectCount).toBe(expected);
    expect(build.projectCount).toBeLessThanOrEqual(projects.length);
    expect(build.areas.reduce((sum, area) => sum + area.projectCount, 0)).toBeGreaterThanOrEqual(
      build.projectCount,
    );
  });

  it("reports coverage instead of pretending every project is attributed", () => {
    // One project is tagged only "Web Development", a label the Web Development
    // category never lists, so strict matching leaves it unattributed.
    expect(architecture.coveredProjects).toBe(architecture.totalProjects - 1);
    expect(architecture.totalProjects).toBe(22);
    const sum = architecture.stages.reduce((total, stage) => total + stage.projectCount, 0);
    expect(sum).toBe(architecture.coveredProjects + architecture.crossingProjects);
  });

  it("records only projects that genuinely cross stages", () => {
    for (const crossing of architecture.crossings) {
      expect(crossing.stages.length).toBeGreaterThan(1);
      expect(crossing.slug).toBe(slugify(crossing.title));
    }
    expect(architecture.crossingProjects).toBe(architecture.crossings.length);
    expect(architecture.crossings.length).toBeLessThan(projects.length / 4);
  });

  it("orders a crossing's stages by the reading order", () => {
    const order = STAGE_DEFINITIONS.map((stage) => stage.id);
    for (const crossing of architecture.crossings) {
      const positions = crossing.stages.map((id) => order.indexOf(id));
      expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    }
  });

  it("leaves a stage with no evidence at zero rather than empty-string", () => {
    const empty = buildCapabilityArchitecture(skills, []);
    for (const stage of empty.stages) {
      expect(stage.projectCount).toBe(0);
      expect(stage.domains).toEqual([]);
    }
    expect(empty.crossings).toEqual([]);
    expect(empty.coveredProjects).toBe(0);
  });
});

describe("determinism", () => {
  it("produces byte-identical output for the same input", () => {
    const again = buildCapabilityArchitecture(skills, projects);
    expect(JSON.stringify(again)).toBe(JSON.stringify(architecture));
  });

  it("is not affected by input project order", () => {
    const reversed = buildCapabilityArchitecture(skills, [...projects].reverse());
    for (const [index, stage] of architecture.stages.entries()) {
      expect(reversed.stages[index].projectCount).toBe(stage.projectCount);
      expect(reversed.stages[index].skillCount).toBe(stage.skillCount);
    }
  });
});

describe("labels", () => {
  it("names every stage for a crossing path", () => {
    expect(stageName("model")).toBe("Model");
    expect(stageName("operate")).toBe("Operate");
  });

  it("exposes a bounded depth scale", () => {
    expect(MAX_DEPTH).toBe(5);
    for (const level of architecture.depthLevels) {
      expect(level).toBeGreaterThanOrEqual(1);
      expect(level).toBeLessThanOrEqual(MAX_DEPTH);
    }
    expect([...architecture.depthLevels].sort((a, b) => b - a)).toEqual(architecture.depthLevels);
  });

  it("gives every area a deep-link id and a non-empty summary", () => {
    for (const stage of architecture.stages) {
      for (const area of stage.areas) {
        expect(area.id).toBe(slugify(area.name));
        expect(area.summary.length).toBeGreaterThan(20);
      }
    }
  });
});
