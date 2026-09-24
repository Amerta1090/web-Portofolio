import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { GitHubData } from "../types/github";
import GitHubCommandCenter from "./GitHubCommandCenter";

const makeGitHubData = (overrides: Partial<GitHubData> = {}): GitHubData => ({
  pinned_repos: [],
  total_stars: 42,
  total_forks: 7,
  total_repos: 12,
  languages: [{ language: "TypeScript", percentage: 80 }],
  contribution_count: 1337,
  commit_activity: [],
  contributions: { totalContributions: 0, weeks: [] },
  top_repos: [],
  repo_activity: [],
  weekly_pattern: { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 },
  derived_metrics: { longest_streak: 9, busiest_month: "March", most_active_day: "Friday" },
  star_history: {},
  ...overrides,
});

const metricProps: string[] = [];

vi.mock("./MetricCard", () => ({
  default: (props: { label: string; value: number; index: number }) => {
    metricProps.push(props.label);
    return (
      <div data-testid="metric">
        {props.label}:{props.value}:{props.index}
      </div>
    );
  },
}));

vi.mock("./LanguageRadial", () => ({
  default: (props: { languages: GitHubData["languages"] }) => (
    <div data-testid="radial">{props.languages.length}</div>
  ),
}));

vi.mock("./ActivityWave", () => ({
  default: (props: { data: GitHubData["weekly_pattern"] }) => (
    <div data-testid="wave">{props.data.mon + props.data.tue}</div>
  ),
}));

vi.mock("./ContributionHeatmap", () => ({
  default: (props: { longestStreak: number }) => (
    <div data-testid="heatmap">{props.longestStreak}</div>
  ),
}));

describe("GitHubCommandCenter (composite: 4×MetricCard + radial + wave + heatmap)", () => {
  it("passes the four metric cards with label/value/index", () => {
    render(<GitHubCommandCenter gitHubData={makeGitHubData()} />);
    const cards = screen.getAllByTestId("metric");
    expect(cards).toHaveLength(4);
    expect(metricProps).toEqual(["Repositories", "Total Stars", "Total Forks", "Contributions"]);
  });

  it("renders radial, wave and heatmap with data-derived props", () => {
    render(<GitHubCommandCenter gitHubData={makeGitHubData()} />);
    expect(screen.getByTestId("radial")).toHaveTextContent("1");
    expect(screen.getByTestId("wave")).toHaveTextContent("3"); // mon(1)+tue(2)
    expect(screen.getByTestId("heatmap")).toHaveTextContent("9"); // longest_streak
  });

  it("uses deterministic ordered indices for stagger", () => {
    render(<GitHubCommandCenter gitHubData={makeGitHubData()} />);
    const cards = screen.getAllByTestId("metric");
    expect(cards).toHaveLength(4);
    expect(cards[0]).toHaveTextContent(":0");
    expect(cards[3]).toHaveTextContent(":3");
  });
});
