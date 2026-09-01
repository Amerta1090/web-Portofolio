import { describe, expect, it } from "vitest";
import type { GitHubData } from "../../types/github";
import type { Project } from "../../types/projects";
import { generateInsights } from "./insights";

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

const BIG: Project[] = [
  p({
    title: "Alpha",
    category: "ml",
    period: "Jan 2024 – Mar 2024",
    skills: ["Python", "ML", "API"],
    description: "built a model to forecast values with ML",
  }),
  p({
    title: "Beta",
    category: "ml",
    period: "Jun 2024 – Jul 2024",
    skills: ["Python", "ML"],
    description: "a classifier backend with fastapi",
  }),
  p({
    title: "Gamma",
    category: "web",
    period: "Jan 2025 – Feb 2025",
    skills: ["TypeScript", "React"],
    description: "a frontend dashboard",
  }),
  p({
    title: "Delta",
    category: "iot",
    period: "Mar 2025 – Apr 2025",
    skills: ["Python", "ESP", "Sensor"],
    association: "Campus",
  }),
];

describe("generateInsights", () => {
  it("returns a deterministic, non-empty ordered list", () => {
    const a = generateInsights({ projects: BIG, github: null });
    const b = generateInsights({ projects: BIG, github: null });
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
    expect(a.length).toBeGreaterThanOrEqual(4);
  });

  it("every insight carries a rule (reproducibility contract)", () => {
    for (const ins of generateInsights({ projects: BIG, github: null })) {
      expect(ins.id).toBeTruthy();
      expect(ins.title).toBeTruthy();
      expect(ins.rule).toBeTruthy();
      expect(ins.body).toBeTruthy();
    }
  });

  it("handles an empty dataset without throwing", () => {
    expect(() => generateInsights({ projects: [], github: null })).not.toThrow();
    expect(generateInsights({ projects: [], github: null })).toHaveLength(0);
  });

  it("reports the dominant skill insight", () => {
    const ins = generateInsights({ projects: BIG, github: null });
    expect(ins.find((i) => i.id === "top-skill")?.title).toContain("Python");
  });

  it("uses GitHub cache when provided", () => {
    const gh: GitHubData = {
      pinned_repos: [],
      total_stars: 1234,
      total_forks: 55,
      total_repos: 10,
      languages: [{ language: "Python", percentage: 56 }],
      contribution_count: 100,
      commit_activity: [],
      contributions: { totalContributions: 0, weeks: [] },
      top_repos: [],
      repo_activity: [],
      weekly_pattern: { mon: 0, tue: 0, wed: 0, thu: 10, fri: 0, sat: 0, sun: 0 },
      derived_metrics: {
        longest_streak: 0,
        busiest_month: "",
        most_active_day: "",
      },
      star_history: {},
    };
    const ins = generateInsights({ projects: BIG, github: gh });
    expect(ins.find((i) => i.id === "github-scale")?.body).toContain("1,234");
    expect(ins.find((i) => i.id === "active-day")?.title).toContain("Thursday");
  });
});
