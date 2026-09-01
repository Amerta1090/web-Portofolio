import { Activity, Boxes, CalendarRange, GitFork, Layers, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import MetricCard from "./MetricCard";

export interface OverviewMetrics {
  projects: number;
  categories: number;
  technologies: number;
  yearSpan: number;
  totalRepos: number;
  totalStars: number;
  totalForks: number;
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
    { icon: Star, value: metrics.totalStars, label: "GitHub stars" },
    { icon: GitFork, value: metrics.totalForks, label: "GitHub forks" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((c, i) => (
        <div data-observatory="metric" key={c.label}>
          <MetricCard icon={c.icon} value={c.value} label={c.label} index={i} />
        </div>
      ))}
    </div>
  );
}
