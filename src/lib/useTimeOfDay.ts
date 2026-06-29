export type TimePeriod = "dawn" | "morning" | "afternoon" | "evening" | "night";

export interface TimeOfDay {
  period: TimePeriod;
  hour: number;
  greeting: string;
  warmth: number;
}

function getPeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function getGreeting(period: TimePeriod): string {
  switch (period) {
    case "dawn":
      return "Good morning";
    case "morning":
      return "Good morning";
    case "afternoon":
      return "Good afternoon";
    case "evening":
      return "Good evening";
    case "night":
      return "Good evening";
  }
}

function getWarmth(period: TimePeriod): number {
  switch (period) {
    case "dawn":
      return 0.6;
    case "morning":
      return 0.8;
    case "afternoon":
      return 1.0;
    case "evening":
      return 0.7;
    case "night":
      return 0.3;
  }
}

export function useTimeOfDay(): TimeOfDay {
  if (typeof window === "undefined") {
    return { period: "afternoon", hour: 14, greeting: "Good afternoon", warmth: 1.0 };
  }

  const hour = new Date().getHours();
  const period = getPeriod(hour);
  const greeting = getGreeting(period);
  const warmth = getWarmth(period);

  return { period, hour, greeting, warmth };
}
