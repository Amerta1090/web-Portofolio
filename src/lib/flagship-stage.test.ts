import { describe, expect, it } from "vitest";
import { getFlagshipProjects } from "./data";
import { buildFlagshipStageItems, shortTitle } from "./flagship-stage";

describe("buildFlagshipStageItems", () => {
  const flagships = getFlagshipProjects();
  const items = buildFlagshipStageItems(flagships);

  it("keeps the flagship rank order from data/projects.json", () => {
    expect(items.map((item) => item.name)).toEqual(flagships.map((p) => shortTitle(p.title)));
    expect(items.length).toBeGreaterThan(0);
  });

  it("prints the figure and caption the data layer states, never one of its own", () => {
    items.forEach((item, i) => {
      expect(item.figure).toBe(flagships[i].flagship_figure?.value);
      expect(item.figureCaption).toBe(flagships[i].flagship_figure?.caption);
      expect(item.discipline).toBe(flagships[i].discipline);
      expect(item.figure).not.toBe("");
    });
  });

  it("links each flagship to its canonical /work page and its source", () => {
    for (const item of items) {
      expect(item.href.startsWith("/work/")).toBe(true);
      expect(item.sourceUrl).toMatch(/github\.com/);
    }
  });

  it("labels the link by what is behind it", () => {
    items.forEach((item, i) => {
      expect(item.linkLabel).toBe(flagships[i].case_study ? "Case study" : "Project");
    });
  });
});

describe("shortTitle", () => {
  it("drops the subtitle after an em dash or colon", () => {
    expect(shortTitle("Red Devil Dynamics — AI Goal Timing")).toBe("Red Devil Dynamics");
    expect(shortTitle("AI Quranic Tafsir Assistant: Hybrid")).toBe("AI Quranic Tafsir Assistant");
    expect(shortTitle("Plain")).toBe("Plain");
  });
});
