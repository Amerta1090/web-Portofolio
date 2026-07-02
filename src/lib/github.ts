import fs from "node:fs";
import path from "node:path";
import type {
  ContributionCalendar,
  DerivedGitHubMetrics,
  GitHubCommitActivity,
  GitHubData,
  GitHubLangStats,
  GitHubReadme,
  GitHubRepo,
  GitHubRepoActivity,
  StarHistory,
  WeeklyPattern,
} from "../types/github";

const USERNAME = "Amerta1090";
const CACHE_DIR = path.join(process.cwd(), ".cache", "github");
const TOKEN = process.env.GITHUB_TOKEN;

function cacheFile(name: string): string {
  return path.join(CACHE_DIR, name);
}

function readCache<T>(name: string): T | null {
  try {
    const file = cacheFile(name);
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
    }
  } catch {}
  return null;
}

function writeCache(name: string, data: unknown): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(cacheFile(name), JSON.stringify(data, null, 2));
  } catch {
    console.warn(`[github] Failed to write cache: ${name}`);
  }
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "portfolio-builder",
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  return headers;
}

async function graphQL<T>(query: string): Promise<T> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`GraphQL ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

async function rest<T>(url: string): Promise<T> {
  const endpoint = url.startsWith("http") ? url : `https://api.github.com${url}`;
  const res = await fetch(endpoint, { headers: authHeaders() });
  if (!res.ok) throw new Error(`REST ${res.status} ${res.statusText} — ${url}`);
  return res.json() as Promise<T>;
}

export async function fetchPinnedRepos(): Promise<GitHubRepo[]> {
  const cached = readCache<GitHubRepo[]>("pinned-repos.json");
  if (cached && cached.length > 0) return cached;

  const query = `{
    user(login: "${USERNAME}") {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            url
            stargazerCount
            forkCount
            primaryLanguage { name }
            repositoryTopics(first: 10) {
              nodes { topic { name } }
            }
            updatedAt
            createdAt
            pushedAt
            isFork
            diskUsage
          }
        }
      }
    }
  }`;

  try {
    const result = await graphQL<{
      data: {
        user: {
          pinnedItems: {
            nodes: Array<{
              name: string;
              description: string | null;
              url: string;
              stargazerCount: number;
              forkCount: number;
              primaryLanguage: { name: string } | null;
              repositoryTopics: { nodes: Array<{ topic: { name: string } }> };
              updatedAt: string;
              createdAt: string;
              pushedAt: string;
              isFork: boolean;
              diskUsage: number;
            }>;
          };
        };
      };
    }>(query);

    const now = Date.now();
    const repos = result.data.user.pinnedItems.nodes.map((n) => {
      const created = new Date(n.createdAt).getTime();
      return {
        name: n.name,
        description: n.description,
        url: n.url,
        stars: n.stargazerCount,
        forks: n.forkCount,
        language: n.primaryLanguage?.name ?? null,
        topics: n.repositoryTopics.nodes.map((t) => t.topic.name),
        updated_at: n.updatedAt,
        created_at: n.createdAt,
        pushed_at: n.pushedAt,
        is_fork: n.isFork,
        size: n.diskUsage,
        age_days: Math.floor((now - created) / 86400000),
      };
    });

    writeCache("pinned-repos.json", repos);
    return repos;
  } catch (err) {
    console.warn(`[github] Pinned repos fetch failed: ${err}`);
    const fallback = readCache<GitHubRepo[]>("pinned-repos.json");
    if (fallback) return fallback;
    return [];
  }
}

export async function fetchAllRepos(): Promise<GitHubRepo[]> {
  const cached = readCache<GitHubRepo[]>("all-repos.json");
  if (cached && cached.length > 0) return cached;

  try {
    const repos = await rest<
      Array<{
        name: string;
        description: string | null;
        html_url: string;
        stargazers_count: number;
        forks_count: number;
        language: string | null;
        topics: string[];
        updated_at: string;
        created_at: string;
        pushed_at: string;
        fork: boolean;
        size: number;
      }>
    >(`/users/${USERNAME}/repos?per_page=100&sort=updated&direction=desc`);

    const now = Date.now();
    const mapped = repos.map((r) => {
      const created = new Date(r.created_at).getTime();
      return {
        name: r.name,
        description: r.description,
        url: r.html_url,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language,
        topics: r.topics ?? [],
        updated_at: r.updated_at,
        created_at: r.created_at,
        pushed_at: r.pushed_at,
        is_fork: r.fork,
        size: r.size,
        age_days: Math.floor((now - created) / 86400000),
      };
    });

    writeCache("all-repos.json", mapped);
    return mapped;
  } catch (err) {
    console.warn(`[github] All repos fetch failed: ${err}`);
    const fallback = readCache<GitHubRepo[]>("all-repos.json");
    if (fallback) return fallback;
    return [];
  }
}

export async function fetchLanguages(): Promise<GitHubLangStats[]> {
  const cached = readCache<GitHubLangStats[]>("languages.json");
  if (cached && cached.length > 0) return cached;

  try {
    const repos = await fetchAllRepos();
    const langMap = new Map<string, number>();

    await Promise.all(
      repos.slice(0, 30).map(async (repo) => {
        try {
          const langs = await rest<Record<string, number>>(
            `/repos/${USERNAME}/${repo.name}/languages`,
          );
          for (const [lang, bytes] of Object.entries(langs)) {
            langMap.set(lang, (langMap.get(lang) ?? 0) + bytes);
          }
        } catch {
          // skip individual repo language failures
        }
      }),
    );

    const total = [...langMap.values()].reduce((a, b) => a + b, 0);
    const stats: GitHubLangStats[] = [...langMap.entries()]
      .map(([language, bytes]) => ({
        language,
        percentage: Math.round((bytes / total) * 1000) / 10,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10);

    writeCache("languages.json", stats);
    return stats;
  } catch (err) {
    console.warn(`[github] Languages fetch failed: ${err}`);
    const fallback = readCache<GitHubLangStats[]>("languages.json");
    if (fallback) return fallback;
    return [];
  }
}

export async function fetchCommitActivity(): Promise<GitHubCommitActivity[]> {
  const cached = readCache<GitHubCommitActivity[]>("commit-activity.json");
  if (cached && cached.length > 0) return cached;

  try {
    const repos = await fetchAllRepos();
    const weeklyMap = new Map<number, number>();

    await Promise.all(
      repos.slice(0, 10).map(async (repo) => {
        try {
          const activity = await rest<Array<{ week: number; total: number; days: number[] }>>(
            `/repos/${USERNAME}/${repo.name}/stats/commit_activity`,
          );

          if (Array.isArray(activity)) {
            for (const w of activity) {
              weeklyMap.set(w.week, (weeklyMap.get(w.week) ?? 0) + w.total);
            }
          }
        } catch {
          // skip individual failures
        }
      }),
    );

    const entries = [...weeklyMap.entries()]
      .map(([week, total]) => ({ week, total, days: [] }))
      .sort((a, b) => a.week - b.week)
      .slice(-12);

    writeCache("commit-activity.json", entries);
    return entries;
  } catch (err) {
    console.warn(`[github] Commit activity fetch failed: ${err}`);
    const fallback = readCache<GitHubCommitActivity[]>("commit-activity.json");
    if (fallback) return fallback;
    return [];
  }
}

export async function fetchContributions(): Promise<ContributionCalendar> {
  const cached = readCache<ContributionCalendar>("contributions.json");
  if (cached) return cached;

  const query = `{
    user(login: "${USERNAME}") {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
              color
            }
          }
        }
      }
    }
  }`;

  try {
    const result = await graphQL<{
      data: {
        user: {
          contributionsCollection: {
            contributionCalendar: {
              totalContributions: number;
              weeks: Array<{
                contributionDays: Array<{
                  contributionCount: number;
                  date: string;
                  color: string;
                }>;
              }>;
            };
          };
        };
      };
    }>(query);

    const cal = result.data.user.contributionsCollection.contributionCalendar;

    const mapped: ContributionCalendar = {
      totalContributions: cal.totalContributions,
      weeks: cal.weeks.map((w) => ({
        days: w.contributionDays.map((d) => {
          let level: 0 | 1 | 2 | 3 | 4 = 0;
          if (d.contributionCount > 0) {
            if (d.contributionCount <= 3) level = 1;
            else if (d.contributionCount <= 6) level = 2;
            else if (d.contributionCount <= 9) level = 3;
            else level = 4;
          }
          return { count: d.contributionCount, date: d.date, level };
        }),
      })),
    };

    writeCache("contributions.json", mapped);
    return mapped;
  } catch (err) {
    console.warn(`[github] Contributions fetch failed: ${err}`);
    const fallback = readCache<ContributionCalendar>("contributions.json");
    if (fallback) return fallback;
    return { totalContributions: 0, weeks: [] };
  }
}

export async function fetchReadme(owner: string, repo: string): Promise<GitHubReadme | null> {
  const cacheKey = `readme-${repo}.json`;
  const cached = readCache<GitHubReadme>(cacheKey);
  if (cached) return cached;

  try {
    const data = await rest<{ content: string; html_url: string }>(
      `/repos/${owner}/${repo}/readme`,
    );
    const decoded = Buffer.from(data.content, "base64").toString("utf-8");
    const readme: GitHubReadme = {
      content: decoded,
      fetched_at: new Date().toISOString(),
    };
    writeCache(cacheKey, readme);
    return readme;
  } catch (err) {
    console.warn(`[github] README fetch failed for ${repo}: ${err}`);
    return null;
  }
}

export async function fetchTopRepos(): Promise<GitHubRepo[]> {
  const cached = readCache<GitHubRepo[]>("top-repos.json");
  if (cached && cached.length > 0) return cached;

  try {
    const repos = await fetchAllRepos();
    const sorted = repos.sort((a, b) => b.stars - a.stars).slice(0, 10);
    writeCache("top-repos.json", sorted);
    return sorted;
  } catch (err) {
    console.warn(`[github] Top repos fetch failed: ${err}`);
    const fallback = readCache<GitHubRepo[]>("top-repos.json");
    if (fallback) return fallback;
    return [];
  }
}

export async function fetchRepoActivity(): Promise<GitHubRepoActivity[]> {
  const cached = readCache<GitHubRepoActivity[]>("repo-activity.json");
  if (cached && cached.length > 0) return cached;

  try {
    const repos = await fetchAllRepos();
    const topRepos = repos.sort((a, b) => b.stars - a.stars).slice(0, 5);

    const activity = await Promise.all(
      topRepos.map(async (repo) => {
        try {
          const commits = await rest<Array<{ commit: { message: string }; html_url: string }>>(
            `/repos/${USERNAME}/${repo.name}/commits?per_page=5`,
          );

          return {
            repo_name: repo.name,
            repo_url: repo.url,
            commits: commits.map((c) => ({
              message: c.commit.message.split("\n")[0],
              date: "",
              url: c.html_url,
            })),
          };
        } catch {
          return { repo_name: repo.name, repo_url: repo.url, commits: [] };
        }
      }),
    );

    writeCache("repo-activity.json", activity);
    return activity;
  } catch (err) {
    console.warn(`[github] Repo activity fetch failed: ${err}`);
    const fallback = readCache<GitHubRepoActivity[]>("repo-activity.json");
    if (fallback) return fallback;
    return [];
  }
}

export async function fetchStarHistory(
  owner: string,
  repo: string,
): Promise<StarHistory> {
  const cacheKey = `star-history-${repo}.json`;
  const cached = readCache<StarHistory>(cacheKey);
  if (cached && cached.length > 0) return cached;

  try {
    const stars: StarHistory = [];
    let page = 1;
    const perPage = 100;

    while (page <= 10) {
      const data = await rest<
        Array<{
          starred_at: string;
        }>
      >(
        `/repos/${owner}/${repo}/stargazers?per_page=${perPage}&page=${page}`,
      );

      if (!Array.isArray(data) || data.length === 0) break;

      for (const s of data) {
        const month = s.starred_at.slice(0, 7);
        const existing = stars.find((e) => e.date === month);
        if (existing) {
          existing.count += 1;
        } else {
          stars.push({ date: month, count: 1 });
        }
      }

      if (data.length < perPage) break;
      page++;
    }

    stars.sort((a, b) => a.date.localeCompare(b.date));

    writeCache(cacheKey, stars);
    return stars;
  } catch (err) {
    console.warn(`[github] Star history fetch failed for ${repo}: ${err}`);
    const fallback = readCache<StarHistory>(cacheKey);
    if (fallback) return fallback;
    return [];
  }
}

export function deriveWeeklyPattern(
  commitActivity: GitHubCommitActivity[],
): WeeklyPattern {
  const dayTotals = [0, 0, 0, 0, 0, 0, 0];

  for (const week of commitActivity) {
    if (week.days.length === 7) {
      for (let d = 0; d < 7; d++) {
        dayTotals[d] += week.days[d];
      }
    }
  }

  return {
    mon: dayTotals[0],
    tue: dayTotals[1],
    wed: dayTotals[2],
    thu: dayTotals[3],
    fri: dayTotals[4],
    sat: dayTotals[5],
    sun: dayTotals[6],
  };
}

export function deriveMetrics(
  contributions: ContributionCalendar,
): DerivedGitHubMetrics {
  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const dayCounts: Record<string, number> = { sun: 0, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0 };
  const monthCounts: Record<string, number> = {};

  let longestStreak = 0;
  let currentStreak = 0;

  for (const week of contributions.weeks) {
    for (const day of week.days) {
      if (day.count > 0) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }

      const date = new Date(day.date);
      const dayName = dayNames[date.getDay()];
      dayCounts[dayName] = (dayCounts[dayName] ?? 0) + day.count;

      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      monthCounts[monthKey] = (monthCounts[monthKey] ?? 0) + day.count;
    }
  }

  const busiestMonthKey = Object.entries(monthCounts).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0];
  const busiestMonth = busiestMonthKey
    ? monthNames[Number.parseInt(busiestMonthKey.split("-")[1])]
    : "Unknown";

  const mostActiveDay = Object.entries(dayCounts).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0] ?? "mon";

  return {
    longest_streak: longestStreak,
    busiest_month: busiestMonth,
    most_active_day: mostActiveDay,
  };
}

export async function fetchAllGitHubData(): Promise<GitHubData> {
  const [
    pinned_repos,
    languages,
    commit_activity,
    contributions,
    allRepos,
    top_repos,
    repo_activity,
  ] = await Promise.all([
    fetchPinnedRepos(),
    fetchLanguages(),
    fetchCommitActivity(),
    fetchContributions(),
    fetchAllRepos(),
    fetchTopRepos(),
    fetchRepoActivity(),
  ]);

  const total_stars = allRepos.reduce((s, r) => s + r.stars, 0);
  const total_forks = allRepos.reduce((s, r) => s + r.forks, 0);

  const weekly_pattern = deriveWeeklyPattern(commit_activity);
  const derived_metrics = deriveMetrics(contributions);

  const top5 = [...allRepos]
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 5);

  const starHistoryResults = await Promise.allSettled(
    top5.map((r) => fetchStarHistory(USERNAME, r.name)),
  );

  const star_history: Record<string, StarHistory> = {};
  for (let i = 0; i < top5.length; i++) {
    const result = starHistoryResults[i];
    if (result.status === "fulfilled" && result.value.length > 0) {
      star_history[top5[i].name] = result.value;
    }
  }

  return {
    pinned_repos,
    total_stars,
    total_forks,
    total_repos: allRepos.length,
    languages,
    contribution_count: contributions.totalContributions,
    commit_activity,
    contributions,
    top_repos,
    repo_activity,
    weekly_pattern,
    derived_metrics,
    star_history,
  };
}

export function getCachedGitHubData(): GitHubData | null {
  try {
    const pinned = readCache<GitHubRepo[]>("pinned-repos.json");
    const langs = readCache<GitHubLangStats[]>("languages.json");
    const commits = readCache<GitHubCommitActivity[]>("commit-activity.json");
    const contribs = readCache<ContributionCalendar>("contributions.json");
    const allRepos = readCache<GitHubRepo[]>("all-repos.json");
    const topRepos = readCache<GitHubRepo[]>("top-repos.json");
    const repoActivity = readCache<GitHubRepoActivity[]>("repo-activity.json");

    if (!pinned || !langs || !commits || !contribs || !allRepos) return null;

    const total_stars = allRepos.reduce((s, r) => s + r.stars, 0);
    const total_forks = allRepos.reduce((s, r) => s + r.forks, 0);

    const weekly_pattern = deriveWeeklyPattern(commits);
    const derived_metrics = deriveMetrics(contribs);

    return {
      pinned_repos: pinned,
      total_stars,
      total_forks,
      total_repos: allRepos.length,
      languages: langs,
      contribution_count: contribs.totalContributions,
      commit_activity: commits,
      contributions: contribs,
      top_repos: topRepos ?? [],
      repo_activity: repoActivity ?? [],
      weekly_pattern,
      derived_metrics,
      star_history: {},
    };
  } catch {
    return null;
  }
}
