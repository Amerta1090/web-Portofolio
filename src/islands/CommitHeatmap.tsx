import type { GitHubCommitActivity } from "../types/github";

interface Props {
  data: GitHubCommitActivity[];
}

export default function CommitHeatmap({ data }: Props) {
  if (!data.length) {
    return (
      <div className="text-center py-8 text-text-secondary text-sm">
        No commit activity data available.
      </div>
    );
  }

  const maxCommits = Math.max(...data.map((w) => w.total), 1);

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {data.map((week) => {
          const intensity = week.total / maxCommits;
          let bg = "bg-bg-tertiary";
          if (intensity > 0.75) bg = "bg-accent";
          else if (intensity > 0.5) bg = "bg-accent/70";
          else if (intensity > 0.25) bg = "bg-accent-muted/60";
          else if (intensity > 0) bg = "bg-accent-muted/30";

          const date = new Date(week.week * 1000);
          const label = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          return (
            <div
              key={week.week}
              className="flex-1 group relative"
              style={{ minHeight: "48px" }}
            >
              <div
                className={`w-full h-full min-h-[2rem] rounded ${bg} transition-all duration-200 hover:scale-105 hover:brightness-110`}
                style={{
                  height: `${Math.max((week.total / maxCommits) * 100, 8)}%`,
                  minHeight: "8px",
                }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-bg-tertiary text-text-primary text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {week.total} commits<br />
                <span className="text-text-secondary">{label}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-end gap-1.5 pt-2">
        <span className="text-[10px] text-text-secondary">Less</span>
        <div className="w-3 h-3 rounded bg-bg-tertiary" />
        <div className="w-3 h-3 rounded bg-accent-muted/30" />
        <div className="w-3 h-3 rounded bg-accent-muted/60" />
        <div className="w-3 h-3 rounded bg-accent/70" />
        <div className="w-3 h-3 rounded bg-accent" />
        <span className="text-[10px] text-text-secondary">More</span>
      </div>
    </div>
  );
}
