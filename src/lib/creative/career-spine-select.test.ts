import { describe, expect, it } from "vitest";
import type { MeasuredYearGroup } from "./career-spine-select";
import {
  CAREER_READING_LINE,
  CAREER_READING_LINE_PERCENT,
  CAREER_YEAR_SELECTOR,
  activeYearIndex,
  parseEventAnchor,
  parseYearAnchor,
  parseYearAttribute,
  sameYearGroups,
  spineFillFraction,
  yearAnchor,
} from "./career-spine-select";

/** Tops spaced 100px apart, so every expected fraction below is exact. */
const SPACED: MeasuredYearGroup[] = [
  { year: 2026, count: 2, top: 1000 },
  { year: 2025, count: 16, top: 1100 },
  { year: 2024, count: 7, top: 1200 },
  { year: 2023, count: 1, top: 1300 },
];

describe("parseYearAttribute", () => {
  it("accepts a bare four-digit year", () => {
    expect(parseYearAttribute("2026")).toBe(2026);
    expect(parseYearAttribute("2023")).toBe(2023);
  });

  it("rejects anything that is not a bare year", () => {
    // A month-precision value must not be silently truncated to its year: that
    // is how a fabricated precision would reach the page.
    for (const value of [null, "", "2026-05", "2026 ", " 2026", "26", "abcd", "02026"]) {
      expect(parseYearAttribute(value), `accepted ${JSON.stringify(value)}`).toBeNull();
    }
  });
});

describe("anchors", () => {
  it("builds the year anchor the heading already carries", () => {
    expect(yearAnchor(2026)).toBe("#career-year-2026");
  });

  it("parses a year anchor and refuses an event anchor", () => {
    expect(parseYearAnchor("#career-year-2025")).toBe(2025);
    // Year and event anchors share the `#career-` prefix; only the exact
    // `year-` segment separates them.
    expect(parseYearAnchor("#career-exp-ferswit")).toBeNull();
    expect(parseYearAnchor("#career-year-20x5")).toBeNull();
    expect(parseYearAnchor("#other")).toBeNull();
    expect(parseYearAnchor("")).toBeNull();
  });

  it("parses an event anchor and refuses a year anchor", () => {
    expect(parseEventAnchor("#career-exp-ferswit")).toBe("exp-ferswit");
    expect(parseEventAnchor("#career-cert-python")).toBe("cert-python");
    // `year-2025` is a year group, not an event called "year-2025".
    expect(parseEventAnchor("#career-year-2025")).toBeNull();
    expect(parseEventAnchor("#career-")).toBeNull();
    expect(parseEventAnchor("#projects")).toBeNull();
  });
});

describe("sameYearGroups", () => {
  it("ignores measured positions, which change on every resize", () => {
    const moved = SPACED.map((group) => ({ ...group, top: group.top + 37 }));
    expect(sameYearGroups(SPACED, moved)).toBe(true);
  });

  it("rejects a changed year, order, size, or length", () => {
    expect(sameYearGroups(SPACED, [SPACED[1], SPACED[0]])).toBe(false);
    expect(sameYearGroups(SPACED, [...SPACED, SPACED[0]])).toBe(false);
    expect(sameYearGroups(SPACED, SPACED.slice(1))).toBe(false);
    expect(
      sameYearGroups(
        SPACED,
        SPACED.map((g, i) => (i === 1 ? { ...g, year: 1999 } : g)),
      ),
    ).toBe(false);
    // A group that gained or lost an event is a different reading: the stepper
    // prints the count, so it has to re-render.
    expect(
      sameYearGroups(
        SPACED,
        SPACED.map((g, i) => (i === 1 ? { ...g, count: 15 } : g)),
      ),
    ).toBe(false);
  });
});

describe("activeYearIndex", () => {
  it("reports the newest year before the reading line reaches any group", () => {
    // A reader looking at the top of the spine is looking at its newest year,
    // not at "nothing yet".
    expect(activeYearIndex(SPACED, 0)).toBe(0);
    expect(activeYearIndex(SPACED, 999)).toBe(0);
    expect(activeYearIndex(SPACED, 1000)).toBe(0);
  });

  it("is the group the line is inside, so a year stays marked while it is read", () => {
    // A group's span is [its own top, the next group's top): the marker names
    // the year the reader is looking at, not the one they just left.
    expect(activeYearIndex(SPACED, 999)).toBe(0);
    expect(activeYearIndex(SPACED, 1000)).toBe(0);
    expect(activeYearIndex(SPACED, 1001)).toBe(0);
    expect(activeYearIndex(SPACED, 1099)).toBe(0);
    expect(activeYearIndex(SPACED, 1100)).toBe(1);
    expect(activeYearIndex(SPACED, 1199)).toBe(1);
    expect(activeYearIndex(SPACED, 1200)).toBe(2);
    expect(activeYearIndex(SPACED, 1299)).toBe(2);
  });

  it("stops at the last one, however far the reader goes", () => {
    expect(activeYearIndex(SPACED, 1300)).toBe(3);
    expect(activeYearIndex(SPACED, 99_999)).toBe(3);
  });

  it("hands the fill the same index at the moment of the switch", () => {
    // The rule's length and the marked year are read from one measurement, so
    // they must not be able to disagree: at the exact top of group *i* the fill
    // is `i / n` and the active index is `i`.
    SPACED.slice(0, -1).forEach((group, index) => {
      expect(activeYearIndex(SPACED, group.top), `year ${group.year}`).toBe(index);
      expect(spineFillFraction(SPACED, group.top), `fill at ${group.year}`).toBeCloseTo(
        index / SPACED.length,
        10,
      );
    });
    // The last group is the documented exception: reaching its top completes
    // the rail, so the fill is 1 rather than `(n - 1) / n`.
    const last = SPACED[SPACED.length - 1];
    expect(activeYearIndex(SPACED, last.top)).toBe(SPACED.length - 1);
    expect(spineFillFraction(SPACED, last.top)).toBe(1);
  });

  it("returns -1 when nothing was measured", () => {
    expect(activeYearIndex([], 1000)).toBe(-1);
  });
});

describe("spineFillFraction", () => {
  it("is 0 before the first heading and 1 from the last heading on", () => {
    expect(spineFillFraction(SPACED, 0)).toBe(0);
    expect(spineFillFraction(SPACED, 999)).toBe(0);
    expect(spineFillFraction(SPACED, 1000)).toBe(0);
    expect(spineFillFraction(SPACED, 1300)).toBe(1);
    expect(spineFillFraction(SPACED, 99_999)).toBe(1);
  });

  it("is i/n at the exact top of year i, and interpolates in between", () => {
    expect(spineFillFraction(SPACED, 1100)).toBeCloseTo(0.25, 10);
    expect(spineFillFraction(SPACED, 1150)).toBeCloseTo(0.375, 10);
    expect(spineFillFraction(SPACED, 1200)).toBeCloseTo(0.5, 10);
    expect(spineFillFraction(SPACED, 1250)).toBeCloseTo(0.625, 10);
  });

  it("never leaves 0–1, even for a degenerate single group", () => {
    const single: MeasuredYearGroup[] = [{ year: 2026, count: 1, top: 500 }];
    expect(spineFillFraction(single, 100)).toBe(0);
    expect(spineFillFraction(single, 500)).toBe(0);
    expect(spineFillFraction(single, 5000)).toBe(1);
    expect(spineFillFraction([], 100)).toBe(0);
  });

  it("survives a collapsed layout, where two years share one offset", () => {
    // Two groups measured at the same document offset: the loop's `from`/`to`
    // pair has zero span, and dividing by it would put `NaN` into a CSS
    // `scaleY`. Both answers stay inside 0–1.
    const collapsed: MeasuredYearGroup[] = [
      { year: 2026, count: 1, top: 500 },
      { year: 2025, count: 1, top: 500 },
    ];
    for (const line of [0, 499, 500, 501, 5000]) {
      const fill = spineFillFraction(collapsed, line);
      expect(Number.isNaN(fill), `line ${line}`).toBe(false);
      expect(fill, `line ${line}`).toBeGreaterThanOrEqual(0);
      expect(fill, `line ${line}`).toBeLessThanOrEqual(1);
    }
    // A collapsed pair in the middle, with real spans around it, interpolates
    // from the span that does exist instead of stalling on the zero-span one.
    const middleCollapsed: MeasuredYearGroup[] = [
      { year: 2026, count: 1, top: 100 },
      { year: 2025, count: 1, top: 500 },
      { year: 2024, count: 1, top: 500 },
      { year: 2023, count: 1, top: 900 },
    ];
    for (const line of [0, 100, 300, 500, 700, 900, 5000]) {
      const fill = spineFillFraction(middleCollapsed, line);
      expect(Number.isNaN(fill), `line ${line}`).toBe(false);
      expect(fill, `line ${line}`).toBeGreaterThanOrEqual(0);
      expect(fill, `line ${line}`).toBeLessThanOrEqual(1);
    }
    // At line 300 the reader is halfway through the 100→500 span that does exist
    // (group 0 of 4), so the fill is 0.5 / 4 — the zero-span pair is stepped over.
    expect(spineFillFraction(middleCollapsed, 300)).toBeCloseTo(0.125, 10);
  });
});

describe("reading line", () => {
  it("sits where a line of body text is being read", () => {
    expect(CAREER_READING_LINE).toBe(0.7);
  });

  it("renders as an integer percentage for the ScrollTrigger strings", () => {
    // `0.7 * 100` is 70.00000000000001; that float would land in both `start`
    // and `end` strings verbatim.
    expect(CAREER_READING_LINE_PERCENT).toBe(70);
    expect(`top ${CAREER_READING_LINE_PERCENT}%`).toBe("top 70%");
  });

  it("names the year group hook once, so the selector has one definition", () => {
    expect(CAREER_YEAR_SELECTOR).toBe("[data-career-year]");
  });
});
