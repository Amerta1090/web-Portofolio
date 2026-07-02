import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";
import { Flame } from "lucide-react";
import type { ContributionCalendar } from "../types/github";

interface Props {
  data: ContributionCalendar;
  longestStreak?: number;
}

const CELL_SIZE = 12;
const CELL_GAP = 2;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export default function ContributionHeatmap({ data, longestStreak = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-64px" });
  const prefersReduced = useReducedMotion();
  const [tooltip, setTooltip] = useState<{
    count: number;
    date: string;
    x: number;
    y: number;
  } | null>(null);

  const totalContributions = data.weeks.reduce(
    (sum, week) => sum + week.days.reduce((daySum, day) => daySum + day.count, 0),
    0,
  );

  if (!data.weeks.length) {
    return (
      <div className="text-center py-8 text-text-secondary text-sm" role="status">
        No contribution data available.
      </div>
    );
  }

  const getCellColor = (level: number, count: number) => {
    if (count === 0) return "var(--bg-tertiary, #27272a)";
    const brand = "122,140,111";
    const opacity = level === 1 ? "0.3" : level === 2 ? "0.5" : level === 3 ? "0.75" : "1";
    return `rgba(${brand},${opacity})`;
  };

  const handleCellHover = (count: number, date: string, e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      count,
      date,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div ref={ref} className="relative">
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-0.5" style={{ minWidth: `${data.weeks.length * (CELL_SIZE + CELL_GAP)}px` }}>
          <div className="flex flex-col gap-0.5 pr-1 pt-2 shrink-0">
            {DAY_LABELS.map((day) => (
              <div
                key={day}
                className="text-[10px] text-text-secondary/60 leading-none"
                style={{ height: CELL_SIZE }}
              >
                {day}
              </div>
            ))}
          </div>
          <div className="flex gap-0.5">
            {data.weeks.map((week, wi) => (
              <div key={week.days[0]?.date ?? wi} className="flex flex-col gap-0.5">
                {week.days.map((day) => {
                  const cellKey = day.date || `${wi}`;
                  if (prefersReduced) {
                    return (
                      <div
                        key={cellKey}
                        className="rounded-[2px]"
                        style={{
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                          backgroundColor: getCellColor(day.level, day.count),
                        }}
                        title={`${day.count} contributions on ${day.date}`}
                      />
                    );
                  }
                  return (
                    <motion.div
                      key={cellKey}
                      className="rounded-[2px] cursor-pointer"
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        backgroundColor: getCellColor(day.level, day.count),
                      }}
                      initial={isInView ? { scale: 0, opacity: 0 } : false}
                      animate={
                        isInView
                          ? {
                              scale: 1,
                              opacity: 1,
                              transition: {
                                duration: 0.15,
                                delay: (wi * week.days.length + week.days.indexOf(day)) * 0.001,
                                ease: [0.16, 1, 0.3, 1],
                              },
                            }
                          : {}
                      }
                      whileHover={{
                        scale: 1.8,
                        zIndex: 10,
                        transition: { duration: 0.12 },
                      }}
                      onMouseEnter={(e) => handleCellHover(day.count, day.date, e)}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          className="absolute pointer-events-none z-20"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="bg-[#0f0f11]/90 backdrop-blur-md border border-border/50 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
            <p className="text-sm font-semibold text-text-primary">
              {tooltip.count} contribution{tooltip.count !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-text-secondary/60">{tooltip.date}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-4 text-xs">
          <span className="text-text-secondary/60">{totalContributions} contributions in the last year</span>
          {longestStreak > 0 && (
            <span className="flex items-center gap-1.5 text-text-secondary/80">
              <Flame className="w-3.5 h-3.5 text-orange-400" aria-hidden="true" />
              {longestStreak}-day streak
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-text-secondary/50">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className="rounded-[2px]"
              style={{
                width: 10,
                height: 10,
                backgroundColor: getCellColor(level as 0 | 1 | 2 | 3 | 4, level),
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
