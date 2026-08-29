import { describe, it, expect } from "vitest";
import { buildSearchIndex, type SearchItem } from "./buildIndex";
import { getProjects, getSkills, getCertifications, getExperience } from "../data";

function groupByType(items: SearchItem[]): Record<string, SearchItem[]> {
  return items.reduce<Record<string, SearchItem[]>>((acc, it) => {
    (acc[it.type] ??= []).push(it);
    return acc;
  }, {});
}

describe("buildSearchIndex", () => {
  it("is deterministic (same input => same output)", () => {
    expect(buildSearchIndex()).toEqual(buildSearchIndex());
  });

  it("contains every expected item type", () => {
    const byType = groupByType(buildSearchIndex());
    for (const t of ["person", "skill", "project", "experience", "certification", "page", "lab"]) {
      expect(byType[t]?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("indexes all projects with correct /projects/[slug] targets", () => {
    const byType = groupByType(buildSearchIndex());
    const projects = byType["project"];
    expect(projects).toHaveLength(getProjects().length);
    for (const p of projects) {
      expect(p.target).toMatch(/^\/projects\//);
      expect(p.target).toBe(p.target.toLowerCase());
      expect(p.title).toBeTruthy();
    }
  });

  it("indexes every skill targetting #skills with category keyword", () => {
    const byType = groupByType(buildSearchIndex());
    const skills = byType["skill"];
    const totalSkills = getSkills()
      .categories.reduce((n, c) => n + c.skills.length, 0);
    expect(skills).toHaveLength(totalSkills);
    for (const s of skills) {
      expect(s.target).toBe("/#skills");
      expect(s.keywords.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("indexes lab experiments with /gallery#id targets", () => {
    const byType = groupByType(buildSearchIndex());
    const labs = byType["lab"];
    expect(labs.length).toBeGreaterThanOrEqual(25);
    for (const l of labs) {
      expect(l.target).toMatch(/^\/gallery#/);
      expect(l.keywords.length).toBeGreaterThan(0);
    }
  });

  it("indexes certifications and experiences", () => {
    const byType = groupByType(buildSearchIndex());
    expect(byType["certification"]).toHaveLength(getCertifications().length);
    expect(byType["experience"]).toHaveLength(getExperience().length);
    for (const c of byType["certification"]) {
      expect(c.target).toBe("/certifications");
    }
    for (const e of byType["experience"]) {
      expect(e.target).toBe("/#experience");
    }
  });

  it("indexes nav + footer pages", () => {
    const byType = groupByType(buildSearchIndex());
    const pages = byType["page"];
    expect(pages.length).toBeGreaterThanOrEqual(9); // 5 nav + 5 footer
    for (const p of pages) {
      expect(p.target.startsWith("/")).toBe(true);
    }
  });

  it("every item has a unique id", () => {
    const ids = buildSearchIndex().map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
