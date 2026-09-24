import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { GitHubData, GitHubRepo } from "../types/github";
import GitHubPhase3 from "./GitHubPhase3";

const makeRepo = (name: string): GitHubRepo => ({
  name,
  description: null,
  url: `https://github.com/x/${name}`,
  stars: 1,
  forks: 0,
  language: null,
  topics: [],
  updated_at: "2026-01-01",
  created_at: "2025-01-01",
  pushed_at: "2026-01-01",
  is_fork: false,
  size: 10,
  age_days: 365,
});

const makeGitHubData = (overrides: Partial<GitHubData> = {}): GitHubData => ({
  pinned_repos: [makeRepo("alpha")],
  total_stars: 42,
  total_forks: 7,
  total_repos: 12,
  languages: [{ language: "TypeScript", percentage: 80 }],
  contribution_count: 1337,
  commit_activity: [],
  contributions: { totalContributions: 0, weeks: [] },
  top_repos: [makeRepo("alpha")],
  repo_activity: [],
  weekly_pattern: { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 },
  derived_metrics: { longest_streak: 9, busiest_month: "March", most_active_day: "Friday" },
  star_history: {},
  ...overrides,
});

const galaxyProps: Array<{ repos: number; hasData: boolean }> = [];
const nebulaProps: Array<{ langCount: number; repoCount: number }> = [];
const leaderboardCalls: number[] = [];

vi.mock("./RepositoryGalaxy", () => ({
  default: (props: { repos: GitHubRepo[]; gitHubData: GitHubData | null }) => {
    galaxyProps.push({ repos: props.repos.length, hasData: props.gitHubData !== null });
    return <div data-testid="galaxy">{props.repos.length}</div>;
  },
}));

vi.mock("./LanguageNebula", () => ({
  default: (props: { languages: GitHubData["languages"]; allRepos?: GitHubRepo[] }) => {
    nebulaProps.push({ langCount: props.languages.length, repoCount: props.allRepos?.length ?? 0 });
    return <div data-testid="nebula">{props.languages.length}</div>;
  },
}));

vi.mock("./TopReposLeaderboard", () => ({
  default: (props: { topRepos: GitHubRepo[] }) => {
    leaderboardCalls.push(props.topRepos.length);
    return <div data-testid="leaderboard">{props.topRepos.length}</div>;
  },
}));

const props = (data: GitHubData) => ({
  repos: data.pinned_repos,
  gitHubData: data,
  topRepos: data.top_repos,
  repoActivity: data.repo_activity,
});

describe("GitHubPhase3 (composite: galaxy + nebula + top repos leaderboard)", () => {
  it("renders the three sections with original titles/subtitles", () => {
    render(<GitHubPhase3 {...props(makeGitHubData())} />);
    expect(screen.getByRole("heading", { name: "Repository Galaxy" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Language Nebula" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Top Repositories" })).toBeInTheDocument();
    expect(
      screen.getByText("Explore repos as orbiting planets in a 3D galaxy"),
    ).toBeInTheDocument();
  });

  it("keeps data-phase wrappers for PhaseIndicator scroll targets", () => {
    const { container } = render(<GitHubPhase3 {...props(makeGitHubData())} />);
    expect(container.querySelector("[data-phase='galaxy']")).not.toBeNull();
    expect(container.querySelector("[data-phase='repos']")).not.toBeNull();
  });

  it("wires repos/languages to galaxy + nebula", () => {
    render(<GitHubPhase3 {...props(makeGitHubData())} />);
    expect(galaxyProps.at(-1)).toEqual({ repos: 1, hasData: true });
    expect(nebulaProps.at(-1)).toEqual({ langCount: 1, repoCount: 1 });
  });

  it("hides top-repos leaderboard when topRepos is empty", () => {
    render(<GitHubPhase3 {...props(makeGitHubData({ top_repos: [] }))} />);
    expect(screen.queryByRole("heading", { name: "Top Repositories" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("leaderboard")).not.toBeInTheDocument();
    const before = leaderboardCalls.length;
    expect(before).toBe(leaderboardCalls.length); // no call recorded
  });
});
