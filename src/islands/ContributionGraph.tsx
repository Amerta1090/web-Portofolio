import type { ContributionCalendar } from "../types/github";

interface Props {
  data: ContributionCalendar;
}

function ContributionCell({ level }: { level: number }) {
  return <div className="h-3 w-3 rounded-[2px]" data-level={level} />;
}

export default function ContributionGraph({ data }: Props) {
  if (!data.weeks.length) {
    return (
      <div className="text-center py-8 text-text-secondary text-sm" role="status">
        No contribution data available.
      </div>
    );
  }

  const totalContributions = data.weeks.reduce(
    (sum, week) => sum + week.days.reduce((daySum, day) => daySum + day.count, 0),
    0,
  );
  const DAY_ABBREVS = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div
      className="overflow-x-auto"
      role="img"
      aria-label={`Contribution graph: ${totalContributions} contributions in the last year`}
    >
      <div className="flex gap-0.5">
        <div className="flex flex-col gap-0.5 pr-1 pt-2">
          {DAY_ABBREVS.map((day) => (
            <div key={day} className="h-3 text-[10px] text-text-secondary leading-3">
              {day}
            </div>
          ))}
        </div>
        <div className="flex gap-0.5">
          {data.weeks.map((week) => (
            <div key={week.days[0]?.date ?? "w"} className="flex flex-col gap-0.5">
              {week.days.map((day) => (
                <ContributionCell key={day.date} level={day.level} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">
        {totalContributions} total contributions. Each column represents a week, each cell
        represents a day with contribution level from 0 (no contributions) to 4 (most
        contributions).
      </span>
      <style>{`
        [data-level="1"] { background-color: #7A8C6F40; }
        [data-level="2"] { background-color: #7A8C6F80; }
        [data-level="3"] { background-color: #7A8C6Fb3; }
        [data-level="4"] { background-color: #7A8C6F; }
        [data-level="0"] { background-color: #27272a; }
        :root:not(.dark) [data-level="0"] { background-color: #e5e7eb; }
        :root:not(.dark) [data-level="1"] { background-color: #C17F5940; }
        :root:not(.dark) [data-level="2"] { background-color: #C17F5980; }
        :root:not(.dark) [data-level="3"] { background-color: #C17F59b3; }
        :root:not(.dark) [data-level="4"] { background-color: #C17F59; }
      `}</style>
    </div>
  );
}
