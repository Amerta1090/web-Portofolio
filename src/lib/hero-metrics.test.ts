import { describe, expect, it } from "vitest";
import { buildSiteFacts } from "./facts";
import { HERO_METRIC_HREFS, buildHeroMetrics } from "./hero-metrics";

/**
 * The hero proof row (MOTION-19), as a function: the projection (order,
 * formatting, link target, omission) is pinned, not the dataset's values — those
 * are read back from `SiteFacts` so the test cannot hold a stale number.
 */
const FACTS = { projects: 22, certifications: 1234, yearsExperience: 2 };

describe("buildHeroMetrics", () => {
  it("drops the whole row when there are no facts", () => {
    expect(buildHeroMetrics(null)).toEqual([]);
    expect(buildHeroMetrics(undefined)).toEqual([]);
  });

  it("projects every figure, the work first, each linked to where it is listed", () => {
    expect(buildHeroMetrics(FACTS)).toEqual([
      { id: "projects", label: "Projects", value: "22", suffix: "", href: "/work", name: "Projects: 22" },
      {
        id: "certifications",
        label: "Certifications",
        value: "1,234",
        suffix: "",
        href: "/about#certifications",
        name: "Certifications: 1,234",
      },
      {
        id: "experience",
        label: "Experience",
        value: "2",
        suffix: "years",
        href: "/about#career",
        name: "Experience: 2 years",
      },
    ]);
  });

  it("drops a figure that is not a positive number, on its own", () => {
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const ids = buildHeroMetrics({ ...FACTS, certifications: bad }).map((m) => m.id);
      expect(ids).toEqual(["projects", "experience"]);
    }
  });

  it("uses a singular unit for one year", () => {
    const [experience] = buildHeroMetrics({ projects: 0, certifications: 0, yearsExperience: 1 });
    expect(experience?.name).toBe("Experience: 1 year");
  });

  it("every target is a canonical route, never a home anchor", () => {
    for (const href of Object.values(HERO_METRIC_HREFS)) expect(href).toMatch(/^\/(work|about)/);
  });

  it("reads the real dataset through SiteFacts", () => {
    const facts = buildSiteFacts();
    const row = buildHeroMetrics({
      projects: facts.projects.count,
      certifications: facts.certifications.count,
      yearsExperience: facts.profile.yearsExperience,
    });
    expect(row.map((m) => m.value)).toEqual([
      String(facts.projects.count),
      String(facts.certifications.count),
      String(facts.profile.yearsExperience),
    ]);
  });
});
