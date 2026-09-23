import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GitHubData } from "../types/github";
import TopReposLeaderboard from "./TopReposLeaderboard";

const mockedRepo = {
  name: "repo-a",
  description: "desc",
  url: "https://github.com/amerta/repo-a",
  stars: 10,
  forks: 2,
  language: "TypeScript",
  topics: [],
  updated_at: "2026-01-01",
  created_at: "2025-01-01",
  pushed_at: "2026-01-01",
  is_fork: false,
  size: 15,
  age_days: 200,
};

const topRepos = [mockedRepo] as GitHubData["top_repos"];
const repoActivity = [
  {
    repo_name: "repo-a",
    repo_url: "https://github.com/amerta/repo-a",
    commits: [
      { message: "feat: fix", url: "https://github.com/amerta/repo-a/commit/1" },
      { message: "fix: sync", url: "https://github.com/amerta/repo-a/commit/2" },
    ],
  },
] as GitHubData["repo_activity"];

describe("TopReposLeaderboard", () => {
  beforeEach(() => {
    // motion `whileInView` butuh IntersectionObserver; stub pasif agar jsdom stabil.
    // Catatan: harus CLASS constructable (`new IO(...)`), bukan arrow factory — arrow
    // function tidak punya [[Construct]] → `new IntersectionObserver()` throws.
    class FakeIO {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    vi.stubGlobal("IntersectionObserver", FakeIO);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders leaderboard and commit feed", () => {
    const { container } = render(
      <TopReposLeaderboard topRepos={topRepos} repoActivity={repoActivity} />,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("clears the feed ticker interval when the tab is hidden", () => {
    const clearSpy = vi.spyOn(window, "clearInterval").mockImplementation(() => {});
    vi.spyOn(window, "setInterval").mockImplementation(() => 1 as unknown as number);
    const original = document.hidden;
    Object.defineProperty(document, "hidden", { configurable: true, value: true });

    const { rerender } = render(
      <TopReposLeaderboard topRepos={topRepos} repoActivity={repoActivity} />,
    );
    document.dispatchEvent(new Event("visibilitychange"));
    rerender(<TopReposLeaderboard topRepos={topRepos} repoActivity={repoActivity} />);

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
    Object.defineProperty(document, "hidden", { configurable: true, value: original });
    vi.restoreAllMocks();
  });
});
