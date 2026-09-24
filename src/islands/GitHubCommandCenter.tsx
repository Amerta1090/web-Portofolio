import { Activity, GitFork, Star } from "lucide-react";
import type { GitHubData } from "../types/github";
import ActivityWave from "./ActivityWave";
import ContributionHeatmap from "./ContributionHeatmap";
import LanguageRadial from "./LanguageRadial";
import MetricCard from "./MetricCard";

interface Props {
  gitHubData: GitHubData;
}

/**
 * Composite island: GitHubUniverse "Command Center" — 4×MetricCard grid,
 * language radial, activity wave and contribution heatmap as ONE React root
 * (previously 7 roots). Markup mirrors the old Astro template exactly so the
 * visual output is unchanged.
 */
export default function GitHubCommandCenter({ gitHubData }: Props) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <MetricCard icon={GitFork} value={gitHubData.total_repos} label="Repositories" index={0} />
        <MetricCard icon={Star} value={gitHubData.total_stars} label="Total Stars" index={1} />
        <MetricCard icon={GitFork} value={gitHubData.total_forks} label="Total Forks" index={2} />
        <MetricCard
          icon={Activity}
          value={gitHubData.contribution_count}
          label="Contributions"
          index={3}
        />
      </div>
      <div className="flex flex-col gap-6 mb-8">
        <div className="bg-bg-secondary border border-border rounded-xl p-6">
          <LanguageRadial languages={gitHubData.languages} />
        </div>
        <div className="bg-bg-secondary border border-border rounded-xl p-6">
          <ActivityWave data={gitHubData.weekly_pattern} />
        </div>
      </div>
      <div className="bg-bg-secondary border border-border rounded-xl p-6 mb-8">
        <ContributionHeatmap
          data={gitHubData.contributions}
          longestStreak={gitHubData.derived_metrics.longest_streak}
        />
      </div>
    </>
  );
}
