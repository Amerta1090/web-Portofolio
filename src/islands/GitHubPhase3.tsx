import type { ReactNode } from "react";
import type { GitHubData, GitHubRepo } from "../types/github";
import LanguageNebula from "./LanguageNebula";
import RepositoryGalaxy from "./RepositoryGalaxy";
import TopReposLeaderboard from "./TopReposLeaderboard";

interface Props {
  repos: GitHubRepo[];
  gitHubData: GitHubData;
  topRepos: GitHubData["top_repos"];
  repoActivity: GitHubData["repo_activity"];
}

interface SectionShellProps {
  title: string;
  subtitle?: string;
  variant?: "default" | "alt";
  ariaLabel?: string;
  children: ReactNode;
}

/**
 * Replicates `Section.astro` + `Container.astro` output — React islands cannot
 * render Astro components, so the shell is rebuilt as plain JSX with identical
 * classes (structure/visual parity with the old phase 3/4 template).
 */
function SectionShell({
  title,
  subtitle,
  variant = "alt",
  ariaLabel,
  children,
}: SectionShellProps) {
  const cls = `py-16 md:py-32 relative overflow-hidden container-query-section ${variant === "alt" ? "bg-bg-secondary border-y border-border" : ""}`;
  return (
    <section aria-label={ariaLabel ?? title} className={cls}>
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-1.5 h-1.5 bg-brand rounded-full" />
            <span className="section-label text-text-secondary">Section</span>
          </div>
          <h2 className="text-h2 font-bold text-text-primary">{title}</h2>
          {subtitle && (
            <div className="mt-3">
              <p className="text-text-secondary text-sm">{subtitle}</p>
            </div>
          )}
        </div>
        <div className="mx-auto px-4 sm:px-6 lg:px-8 w-full max-w-[1200px]">{children}</div>
      </div>
    </section>
  );
}

/**
 * Composite island: GitHubUniverse phases 3+4 — Repository Galaxy, Language
 * Nebula and Top Repos leaderboard as ONE `client:visible` React root
 * (previously 3 roots; RepositoryGalaxy was eager `client:load` → now lazy,
 * which is the GPU/off-screen win).
 *
 * Renders the `data-phase="galaxy"` / `data-phase="repos"` wrappers itself —
 * `PhaseIndicator` scrolls to `[data-phase=…]` via querySelector and the
 * islands' SSR HTML keeps those targets queryable pre-hydration.
 */
export default function GitHubPhase3({ repos, gitHubData, topRepos, repoActivity }: Props) {
  return (
    <>
      <div data-phase="galaxy">
        <SectionShell
          title="Repository Galaxy"
          subtitle="Explore repos as orbiting planets in a 3D galaxy"
          ariaLabel="Repository galaxy"
        >
          <div className="rounded-xl overflow-hidden">
            <RepositoryGalaxy repos={repos} gitHubData={gitHubData} />
          </div>
        </SectionShell>

        <SectionShell
          title="Language Nebula"
          subtitle="Flowing spectrum of your ecosystem"
          variant="default"
          ariaLabel="Language nebula"
        >
          <div className="bg-bg-secondary border border-border rounded-xl p-6">
            <LanguageNebula languages={gitHubData.languages} allRepos={repos} />
          </div>
        </SectionShell>
      </div>

      <div data-phase="repos">
        {topRepos.length > 0 && (
          <SectionShell
            title="Top Repositories"
            subtitle="Premium leaderboard by stars"
            ariaLabel="Top repositories"
          >
            <TopReposLeaderboard topRepos={topRepos} repoActivity={repoActivity} />
          </SectionShell>
        )}
      </div>
    </>
  );
}
