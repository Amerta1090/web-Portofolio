import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { FOOTER_LINKS, NAV_ITEMS } from "./constants";
import { getProjects } from "./data";
import {
  RETIRED_STATIC_ROUTES,
  ROUTES,
  labHref,
  legacyProjectSlug,
  redirectsFile,
  retiredRoutes,
  workHref,
  workSlug,
} from "./routes";

const projects = getProjects();
const retired = retiredRoutes(projects);
const retiredPaths = new Set(retired.map((route) => route.from));
const canonicalRoots = new Set<string>(Object.values(ROUTES).map((href) => href.split("#")[0]));

describe("canonical routes (MOTION-18)", () => {
  it("gives every project exactly one /work URL", () => {
    const slugs = projects.map(workSlug);
    expect(new Set(slugs).size).toBe(projects.length);
    for (const project of projects) expect(workHref(project)).toBe(`/work/${workSlug(project)}`);
  });

  it("publishes a project with a case study at the case-study id", () => {
    const withStudy = projects.filter((project) => project.case_study);
    expect(withStudy.length).toBeGreaterThan(0);
    for (const project of withStudy) expect(workHref(project)).toBe(`/work/${project.case_study}`);
  });

  it("keeps the legacy slug rule byte-for-byte", () => {
    expect(legacyProjectSlug("Red Devil Dynamics — AI Goal Timing")).toBe(
      "red-devil-dynamics-ai-goal-timing",
    );
  });

  it("deep-links experiments into the lab", () => {
    expect(labHref("ulam-spiral")).toBe("/lab#ulam-spiral");
  });
});

describe("retired routes", () => {
  it("retires every old project page onto its /work page", () => {
    for (const project of projects) {
      const route = retired.find((r) => r.from === `/projects/${legacyProjectSlug(project.title)}`);
      expect(route?.to).toBe(workHref(project));
    }
    expect(retired).toHaveLength(RETIRED_STATIC_ROUTES.length + projects.length);
  });

  it("sends every retired URL to a canonical route, never to another retired one", () => {
    for (const route of retired) {
      const path = route.to.split("#")[0];
      expect(retiredPaths.has(path)).toBe(false);
      const isWorkPage = path.startsWith("/work/");
      expect(isWorkPage || canonicalRoots.has(path)).toBe(true);
    }
  });

  it("keeps public/_redirects equal to the route table", () => {
    const committed = readFileSync(resolve(__dirname, "../../public/_redirects"), "utf-8");
    expect(committed).toBe(redirectsFile(projects));
  });
});

describe("navigation", () => {
  it("has at most five items, all canonical", () => {
    expect(NAV_ITEMS.length).toBeLessThanOrEqual(5);
    for (const item of [...NAV_ITEMS, ...FOOTER_LINKS]) {
      expect(retiredPaths.has(item.href.split("#")[0])).toBe(false);
    }
  });

  it("does not repeat a nav label in the footer (the palette would drop it)", () => {
    const nav = new Set<string>(NAV_ITEMS.map((item) => item.label));
    for (const link of FOOTER_LINKS) expect(nav.has(link.label)).toBe(false);
  });
});
