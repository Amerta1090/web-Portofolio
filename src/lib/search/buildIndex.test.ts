import { describe, it, expect } from "vitest";
import { FOOTER_LINKS, NAV_ITEMS } from "../constants";
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

  it("indexes all projects with canonical /work/[slug] targets", () => {
    const byType = groupByType(buildSearchIndex());
    const projects = byType["project"];
    expect(projects).toHaveLength(getProjects().length);
    for (const p of projects) {
      expect(p.target).toMatch(/^\/work\//);
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

  it("indexes lab experiments with /lab#id targets", () => {
    const byType = groupByType(buildSearchIndex());
    const labs = byType["lab"];
    expect(labs.length).toBeGreaterThanOrEqual(25);
    for (const l of labs) {
      expect(l.target).toMatch(/^\/lab#/);
      expect(l.keywords.length).toBeGreaterThan(0);
    }
  });

  it("indexes certifications and experiences", () => {
    const byType = groupByType(buildSearchIndex());
    expect(byType["certification"]).toHaveLength(getCertifications().length);
    expect(byType["experience"]).toHaveLength(getExperience().length);
    for (const c of byType["certification"]) {
      expect(c.target).toBe("/about#certifications");
    }
    for (const e of byType["experience"]) {
      // Experience records live on the Career Spine since M1.4 — the items
      // keep their role titles, only the jump target moved with the section.
      expect(e.target).toBe("/#career");
    }
  });

  it("indexes nav + footer pages", () => {
    const byType = groupByType(buildSearchIndex());
    const pages = byType["page"];
    expect(pages).toHaveLength(NAV_ITEMS.length + FOOTER_LINKS.length); // MOTION-18: no shared labels
    for (const p of pages) {
      expect(p.target.startsWith("/")).toBe(true);
    }
  });

  // MOTION-18: the palette lists the five canonical routes plus footer-only
  // destinations; no retired route can be reached from Ctrl+K.
  it("indexes the canonical routes, never a retired one", () => {
    const pages = groupByType(buildSearchIndex()).page ?? [];
    const targets = pages.map((p) => p.target);
    expect(targets).toEqual(expect.arrayContaining(["/work", "/about", "/lab", "/data", "/#contact"]));
    for (const retired of ["/projects", "/gallery", "/observatory", "/github", "/timeline", "/skills", "/certifications", "/contact"]) {
      expect(targets).not.toContain(retired);
    }
  });

  it("drops duplicate page labels instead of indexing the same id twice", () => {
    const pages = groupByType(buildSearchIndex()).page ?? [];
    expect(pages.filter((p) => p.target === "/data")).toHaveLength(1);
    expect(new Set(pages.map((p) => p.id)).size).toBe(pages.length);
  });

  it("every item has a unique id", () => {
    const ids = buildSearchIndex().map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
