export interface GitHubRepo {
  name: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  updated_at: string;
  created_at: string;
  pushed_at: string;
  is_fork: boolean;
  size: number;
  age_days: number;
}

export interface GitHubLangStats {
  language: string;
  percentage: number;
}

export interface ContributionDay {
  count: number;
  date: string;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionWeek {
  days: ContributionDay[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface GitHubCommitActivity {
  week: number;
  total: number;
  days: number[];
}

export interface GitHubRepoActivity {
  repo_name: string;
  repo_url: string;
  commits: Array<{
    message: string;
    date: string;
    url: string;
  }>;
}

export interface GitHubReadme {
  content: string;
  fetched_at: string;
}

export type StarHistory = Array<{ date: string; count: number }>;

export interface WeeklyPattern {
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;
}

export interface DerivedGitHubMetrics {
  longest_streak: number;
  busiest_month: string;
  most_active_day: string;
}

export interface GitHubData {
  pinned_repos: GitHubRepo[];
  total_stars: number;
  total_forks: number;
  total_repos: number;
  languages: GitHubLangStats[];
  contribution_count: number;
  commit_activity: GitHubCommitActivity[];
  contributions: ContributionCalendar;
  top_repos: GitHubRepo[];
  repo_activity: GitHubRepoActivity[];
  weekly_pattern: WeeklyPattern;
  derived_metrics: DerivedGitHubMetrics;
  star_history: Record<string, StarHistory>;
}
