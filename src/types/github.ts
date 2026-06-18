export interface GitHubRepo {
  name: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  updated_at: string;
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

export interface GitHubData {
  pinned_repos: GitHubRepo[];
  total_stars: number;
  total_forks: number;
  total_repos: number;
  languages: GitHubLangStats[];
  contribution_count: number;
  commit_activity: GitHubCommitActivity[];
  contributions: ContributionCalendar;
}
