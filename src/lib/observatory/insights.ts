import type { GitHubData } from "../../types/github";
import type { Project } from "../../types/projects";
import {
  categoryCounts,
  complexityScore,
  keywordSignals,
  perYearStats,
  skillCounts,
  skillPairs,
} from "./metrics";
import { parsePeriod } from "./parsePeriod";

export interface Insight {
  id: string;
  title: string;
  body: string;
  /** Human-readable, reproducible statement of the exact rule used. */
  rule: string;
}

interface InsightCtx {
  projects: Project[];
  github: GitHubData | null;
}

function fmtCount(n: number): string {
  return n.toLocaleString("en-US");
}

/**
 * Deterministic insight engine. Given the same dataset, it always returns the
 * same ordered list of insights. No randomness, no wall-clock dependence.
 */
export function generateInsights(ctx: InsightCtx): Insight[] {
  const { projects, github } = ctx;
  const dated = projects.filter((p) => parsePeriod(p.period));
  const insights: Insight[] = [];

  // 1. Technology frequency — dominant skill.
  const topSkills = skillCounts(projects);
  if (topSkills.length > 0) {
    const s = topSkills[0];
    insights.push({
      id: "top-skill",
      title: `"${s.skill}" appears most often`,
      body: `Used in ${s.count} of ${projects.length} projects and reaching ${s.categories} distinct ${
        s.categories === 1 ? "category" : "categories"
      }.`,
      rule: "Sort skills by count across all projects (desc); take the first.",
    });
  }

  // 2. Category distribution — dominant category.
  const cats = categoryCounts(projects, []);
  const leadingCategory = cats.reduce((a, b) => (b.count > a.count ? b : a), cats[0]);
  if (leadingCategory && cats.length > 1) {
    insights.push({
      id: "leading-category",
      title: `${leadingCategory.label} leads the portfolio`,
      body: `${leadingCategory.count}/${projects.length} projects (${Math.round(
        leadingCategory.share * 100,
      )}%) fall under ${leadingCategory.label}.`,
      rule: "Count projects per category; pick the largest.",
    });
  }

  // 3. Technology growth over time — whether skills accumulate monotonically.
  const stats = perYearStats(projects, complexityScore);
  if (stats.length >= 2) {
    const first = stats[0];
    const last = stats[stats.length - 1];
    const growth =
      last.cumulativeSkills > 0 && first.cumulativeSkills > 0
        ? Math.round((last.cumulativeSkills / first.cumulativeSkills) * 100) / 100
        : 0;
    insights.push({
      id: "skill-growth",
      title: "Technology breadth keeps compounding",
      body: `Distinct technologies grew from ${fmtCount(first.cumulativeSkills)} in ${first.year} to ${fmtCount(
        last.cumulativeSkills,
      )} by ${last.year} (${growth.toFixed(2)}×) across the dated record.`,
      rule: "Count distinct skills introduced per start-year, accumulate, compare first year vs last year.",
    });
  }

  // 4. Recurring technology combinations — most common skill pair.
  const pairs = skillPairs(projects);
  if (pairs.length > 0 && pairs[0].count > 1) {
    insights.push({
      id: "top-pair",
      title: `A recurring pairing: ${pairs[0].a} + ${pairs[0].b}`,
      body: `These two technologies co-occur in ${pairs[0].count} projects — the most common combination in the dataset.`,
      rule: "Count unordered skill co-occurrence pairs across projects; take the max.",
    });
  }

  // 5. Python dominance (default check) — data-driven, not forged.
  const python = topSkills.find((s) => s.skill.toLowerCase().includes("python"));
  const mlSkills = topSkills.filter((s) =>
    ["machine learning", "data science", "nlp", "mlops", "neural"].some((k) =>
      s.skill.toLowerCase().includes(k),
    ),
  );
  if (python) {
    insights.push({
      id: "python-central",
      title: "Python is the connective tissue",
      body: `"${python.skill}" appears in ${python.count} projects, the data-language that binds the ML/DevOps track.`,
      rule: `Any skill whose name contains "python"; report its project count.`,
    });
  } else if (mlSkills.length > 0) {
    const ml = mlSkills[0];
    insights.push({
      id: "ml-core",
      title: `ML skill at the center: ${ml.skill}`,
      body: `${ml.skill} shows up in ${ml.count} projects, marking the core of the engineering record.`,
      rule: "First ML-like skill (name contains machine learning/data science/nlp/mlops/neural) by frequency.",
    });
  }

  // 6. Category↔skill concentration — top skill per category.
  const catSkills = categoryTopSkills(projects);
  const concentrated = catSkills.filter((c) => c.topCount >= 2);
  if (concentrated.length > 0) {
    const c = concentrated[0];
    insights.push({
      id: "category-skill",
      title: `${categoryLabel(c.category)} leans on "${c.skill}"`,
      body: `Inside ${categoryLabel(c.category)}, "${c.skill}" recurs in ${c.topCount} projects — a defining ingredient of that track.`,
      rule: "For each category, count skill usage; report the category with the highest recurring single skill.",
    });
  }

  // 7. Complexity trend (proxy) — whether projects get measurably richer.
  if (stats.length >= 2) {
    const firstAvg = stats[0].avgComplexity;
    const lastAvg = stats[stats.length - 1].avgComplexity;
    const delta = lastAvg - firstAvg;
    const dir = delta > 0.05 ? "rising" : delta < -0.05 ? "declining" : "steady";
    insights.push({
      id: "complexity-trend",
      title: `Project complexity proxy is ${dir}`,
      body: `Mean complexity proxy moved ${fmtCount(firstAvg)} (${stats[0].year}) → ${fmtCount(
        lastAvg,
      )} (${stats[stats.length - 1].year}). Proxy = skills + prototypes + images + association flag.`,
      rule: "Mean of reconstruction metric per start-year; compare oldest vs newest bucket.",
    });
  }

  // 8. Keyword signals — engineering emphasis derived from text.
  const signals = keywordSignals(projects).sort((a, b) => b.projects - a.projects);
  if (signals.length > 0 && signals[0].projects > 0) {
    const sig = signals[0];
    insights.push({
      id: "keyword-signal",
      title: `Text signals point to "${sig.group}"`,
      body: `${sig.projects}/${projects.length} project descriptions mention ${sig.group}-related terms (e.g. ${EXAMPLE_TERMS[sig.group]})`,
      rule: "Count descriptions matching a curated keyword list per group; take the group with the most matches.",
    });
  }

  // 9. GitHub-linked scale (from cache when available).
  if (github && github.total_repos > 0 && projects.length > 0) {
    insights.push({
      id: "github-scale",
      title: `${fmtCount(github.total_repos)} repositories, ${fmtCount(github.total_stars)} stars`,
      body: `GitHub cache reports ${fmtCount(github.total_repos)} repos and ${fmtCount(
        github.total_stars,
      )} stars total; ${fmtCount(
        github.languages?.length ?? 0,
      )} languages dominate the public work.`,
      rule: "Sum total_repos / total_stars from the cached GitHub snapshot.",
    });
  }

  // 10. Most active day from contribution cache.
  const weekly = github?.weekly_pattern;
  if (weekly) {
    const bestDay = Object.entries(weekly).sort((a, b) => b[1] - a[1])[0];
    if (bestDay && bestDay[1] > 0) {
      insights.push({
        id: "active-day",
        title: `Peak output lands on ${DAY_LABELS[bestDay[0]]}`,
        body: `${DAY_LABELS[bestDay[0]]} accumulates the most commits in the cached weekly pattern (${fmtCount(
          bestDay[1],
        )} total).`,
        rule: "Sum commit activity per weekday; report the max.",
      });
    }
  }

  return insights;
}

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

interface CatTopSkill {
  category: string;
  skill: string;
  topCount: number;
}

function categoryTopSkills(projects: Project[]): CatTopSkill[] {
  const map = new Map<string, Map<string, number>>();
  for (const p of projects) {
    const cat = p.category ?? "other";
    let bucket = map.get(cat);
    if (!bucket) {
      bucket = new Map<string, number>();
      map.set(cat, bucket);
    }
    for (const s of p.skills ?? []) {
      const key = s.trim();
      if (!key) continue;
      bucket.set(key, (bucket.get(key) ?? 0) + 1);
    }
  }
  const out: CatTopSkill[] = [];
  for (const [cat, skills] of map) {
    const top = [...skills.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0];
    if (top && top[1] > 0) out.push({ category: cat, skill: top[0], topCount: top[1] });
  }
  return out.sort((a, b) => b.topCount - a.topCount);
}

function categoryLabel(category: string): string {
  switch (category) {
    case "ml":
      return "Machine Learning";
    case "web":
      return "Web";
    case "iot":
      return "IoT";
    case "cli":
      return "CLI & Tooling";
    case "devops":
      return "DevOps & MLOps";
    default:
      return category;
  }
}

const EXAMPLE_TERMS: Record<string, string> = {
  "machine learning": "model, prediction, classifier",
  "data engineering": "pipeline, dataset, transform",
  devops: "CI/CD, monitoring, docker",
  backend: "API, FastAPI, server",
  frontend: "UI, dashboard, interface",
  iot: "sensor, ESP, embedded",
};
