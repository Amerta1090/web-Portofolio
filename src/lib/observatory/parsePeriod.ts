const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

export interface PeriodPoint {
  year: number;
  month: number;
}

export interface ParsedPeriod {
  start: PeriodPoint;
  /** null means the project is still ongoing (period ends with "Present"). */
  end: PeriodPoint | null;
  /** Human-readable original string, preserved for display. */
  raw: string;
  /** Number of whole months between start and end (0 when ongoing or same-month). */
  durationMonths: number;
  /** True if the whole span sits within a single calendar year. */
  singleYear: boolean;
}

const MONTH_RE = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}$/i;

function parsePoint(token: string): PeriodPoint | null {
  const m = token.trim().match(/^([a-z]+)\.?\s+(\d{4})$/i);
  if (!m) return null;
  const month = MONTHS[m[1].slice(0, 3).toLowerCase()];
  if (month === undefined) return null;
  return { year: Number.parseInt(m[2], 10), month };
}

/**
 * Parse a human-readable project period string of the form
 * "Mon YYYY – Mon YYYY" or "Mon YYYY – Present" into structured points.
 *
 * Deterministic: the same string always yields the same result. Unparseable
 * input returns null (callers must degrade gracefully — never crash).
 */
export function parsePeriod(raw: string): ParsedPeriod | null {
  if (!raw) return null;
  const [startToken, endToken = ""] = raw.split(/[–—-]/).map((s) => s.trim());
  if (!startToken || !MONTH_RE.test(startToken)) return null;

  const start = parsePoint(startToken);
  if (!start) return null;

  let end: PeriodPoint | null = null;
  const normalizedEnd = endToken.toLowerCase();
  if (normalizedEnd && normalizedEnd !== "present" && normalizedEnd !== "now") {
    if (!MONTH_RE.test(endToken)) return null;
    const parsedEnd = parsePoint(endToken);
    if (!parsedEnd) return null;
    end = parsedEnd;
  }

  const durationMonths = end ? (end.year - start.year) * 12 + (end.month - start.month) : 0;

  return {
    start,
    end,
    raw,
    durationMonths,
    singleYear: !end || end.year === start.year,
  };
}

/** Sort key: 0 = ongoing (end null) sorts last, else end date desc. */
export function periodSortKey(p: ParsedPeriod): number {
  const end = p.end ?? { year: Number.MAX_SAFE_INTEGER, month: 11 };
  return end.year * 12 + end.month;
}

/** Composite index for plotting on a time axis (monotonic). */
export function pointIndex(point: PeriodPoint): number {
  return point.year * 12 + point.month;
}
