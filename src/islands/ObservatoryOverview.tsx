import { Activity, Boxes, CalendarRange, GitFork, Layers, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import MetricCard from "./MetricCard";

export interface OverviewMetrics {
  projects: number;
  categories: number;
  technologies: number;
  yearSpan: number;
  /**
   * `null` means "there is no GitHub cache", which is not the same claim as zero
   * stars (M0.8.3). The four non-GitHub cards above are always present; these two
   * are omitted rather than rendered as `0`.
   */
  totalStars: number | null;
  totalForks: number | null;
}

interface Props {
  metrics: OverviewMetrics;
}

interface Card {
  icon: LucideIcon;
  value: number;
  label: string;
}

export default function ObservatoryOverview({ metrics }: Props) {
  const cards: Card[] = [
    { icon: Boxes, value: metrics.projects, label: "Projects catalogued" },
    { icon: Layers, value: metrics.categories, label: "Engineering categories" },
    { icon: Activity, value: metrics.technologies, label: "Distinct technologies" },
    { icon: CalendarRange, value: metrics.yearSpan, label: "Years of work" },
    // M0.8.3 — the page used to coerce an absent cache to 0, so a build with no
    // GitHub data rendered "0 GitHub stars" and "0 GitHub forks". That is a claim
    // about the person, not about the missing data, and a confident zero is worse
    // than an absent fact. Omitting the card is the honest degradation.
    ...(metrics.totalStars === null
      ? []
      : [{ icon: Star, value: metrics.totalStars, label: "GitHub stars" }]),
    ...(metrics.totalForks === null
      ? []
      : [{ icon: GitFork, value: metrics.totalForks, label: "GitHub forks" }]),
  ];

  return (
    <div
      className={`grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 ${cards.length >= 6 ? "lg:grid-cols-6" : "lg:grid-cols-4"}`}
    >
      {cards.map((c, i) => (
        <div data-observatory="metric" key={c.label}>
          <MetricCard icon={c.icon} value={c.value} label={c.label} index={i} />
        </div>
      ))}
    </div>
  );
}
