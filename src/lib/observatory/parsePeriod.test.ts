import { describe, expect, it } from "vitest";
import { parsePeriod, periodSortKey, pointIndex } from "./parsePeriod";

describe("parsePeriod", () => {
  it("parses a full range", () => {
    const p = parsePeriod("May 2026 – Jun 2026");
    expect(p).not.toBeNull();
    expect(p!.start).toEqual({ year: 2026, month: 4 });
    expect(p!.end).toEqual({ year: 2026, month: 5 });
  });

  it("parses an ongoing project", () => {
    const p = parsePeriod("Jun 2026 – Present");
    expect(p).not.toBeNull();
    expect(p!.start).toEqual({ year: 2026, month: 5 });
    expect(p!.end).toBeNull();
    expect(p!.durationMonths).toBe(0);
    expect(p!.singleYear).toBe(true);
  });

  it("accepts 'now' and short month abbreviations", () => {
    expect(parsePeriod("Sep 2025 – Jan 2026")!.start).toEqual({ year: 2025, month: 8 });
    expect(parsePeriod("Mar 2026 – Now")!.end).toBeNull();
  });

  it("handles en-dash, em-dash, and hyphen separators", () => {
    expect(parsePeriod("Dec 2023 – Jan 2024")!.end!.year).toBe(2024);
    expect(parsePeriod("Feb 2025 — Mar 2025")!.end!.month).toBe(2);
    expect(parsePeriod("Jan 2025 - Feb 2025")!.end!.month).toBe(1);
  });

  it("computes duration across years", () => {
    expect(parsePeriod("Dec 2023 – Jan 2024")!.durationMonths).toBe(1);
    expect(parsePeriod("Sep 2024 – Jan 2025")!.durationMonths).toBe(4);
    expect(parsePeriod("Jan 2026 – Mar 2026")!.durationMonths).toBe(2);
  });

  it("detects single vs multi-year", () => {
    expect(parsePeriod("Jan 2025 – Mar 2025")!.singleYear).toBe(true);
    expect(parsePeriod("Sep 2024 – Jan 2025")!.singleYear).toBe(false);
    expect(parsePeriod("Jun 2026 – Present")!.singleYear).toBe(true);
  });

  it("returns null for unparseable input", () => {
    expect(parsePeriod("")).toBeNull();
    expect(parsePeriod("2024")).toBeNull();
    expect(parsePeriod("Circa 2020")).toBeNull();
    expect(parsePeriod(undefined as unknown as string)).toBeNull();
  });

  it("is deterministic (same input, same output)", () => {
    const a = parsePeriod("May 2026 – Jun 2026");
    const b = parsePeriod("May 2026 – Jun 2026");
    expect(a).toEqual(b);
  });
});

describe("periodSortKey / pointIndex", () => {
  it("orders ongoing projects last", () => {
    const ongoing = periodSortKey(parsePeriod("Jan 2026 – Present")!);
    const ended = periodSortKey(parsePeriod("Jan 2026 – Jun 2026")!);
    expect(ongoing).toBeGreaterThan(ended);
  });

  it("orders by end date descending for ended projects", () => {
    const newer = periodSortKey(parsePeriod("Jun 2026 – Jun 2026")!);
    const older = periodSortKey(parsePeriod("Jan 2026 – Feb 2026")!);
    expect(newer).toBeGreaterThan(older);
  });

  it("produces a monotonic timestamp", () => {
    expect(pointIndex({ year: 2026, month: 5 })).toBe(2026 * 12 + 5);
    expect(pointIndex({ year: 2027, month: 0 })).toBeGreaterThan(
      pointIndex({ year: 2026, month: 11 }),
    );
  });
});
