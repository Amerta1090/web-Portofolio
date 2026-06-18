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
      <div className="text-center py-8 text-text-secondary text-sm">
        No contribution data available.
      </div>
    );
  }

  const DAY_ABBREVS = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="overflow-x-auto">
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
      <style>{`
        [data-level="1"] { background-color: #92400e66; }
        [data-level="2"] { background-color: #92400e99; }
        [data-level="3"] { background-color: #92400ecc; }
        [data-level="4"] { background-color: #f59e0b; }
        [data-level="0"] { background-color: #27272a; }
        :root:not(.dark) [data-level="0"] { background-color: #e5e7eb; }
        :root:not(.dark) [data-level="1"] { background-color: #fde68a; }
        :root:not(.dark) [data-level="2"] { background-color: #fcd34d; }
        :root:not(.dark) [data-level="3"] { background-color: #f59e0b; }
        :root:not(.dark) [data-level="4"] { background-color: #d97706; }
      `}</style>
    </div>
  );
}
