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

export interface GitHubData {
  pinned_repos: GitHubRepo[];
  total_stars: number;
  total_forks: number;
  total_repos: number;
  languages: GitHubLangStats[];
  contribution_count: number;
}
