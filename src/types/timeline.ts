export interface TimelineItem {
  id: string;
  date: string;
  year: number;
  type: "work" | "education" | "certification" | "internship" | "milestone";
  title: string;
  subtitle: string;
  description?: string;
  highlights: string[];
  tags: string[];
  url: string | null;
  icon?: string;
}
