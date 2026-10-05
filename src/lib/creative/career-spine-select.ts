/**
 * Career Spine selection rules — zero imports, on purpose.
 *
 * The island that scrubs `#career` (`src/islands/CareerSpine.tsx`) needs to know
 * three things and nothing else: which year groups exist, which one the reader is
 * looking at, and how far along the spine they are. All three are answers about
 * the **rendered page**, so the island reads them from the DOM that
 * `CareerSpine.astro` already shipped (the two `data-` hooks below) instead of
 * taking the `CareerEvent[]` as props.
 *
 * That is a deliberate reversal of the Q4.1 BUG FIX 1 rule ("a value imported by
 * a client island drags its whole module in"). Passing `events` as a prop would
 * make the island depend on the data contract, which imports the entire data
 * layer (`../data`) — measured at 18.5 KB gzip for one five-item string array on
 * `/work/[slug]`. Reading hooks keeps the island's import list at React + GSAP.
 *
 * Everything here is a pure function over plain values, so the scrub arithmetic is
 * testable without a layout engine, and the CSS-selector strings exist in exactly
 * one place (the two hooks `CareerSpine.astro` writes).
 */

/**
 * Where on the viewport the reader is "at" in the spine.
 *
 * Shared by the ScrollTrigger's `start`/`end` strings and by the arithmetic below:
 * one constant, so the drawn rule can never disagree with the year it marks.
 * 70% because that is the height at which a line of body text is being read
 * (the retired `JourneyTimeline` used the same value for the same reason).
 */
export const CAREER_READING_LINE = 0.7;

/**
 * The same line in the form ScrollTrigger's `start`/`end` strings need.
 *
 * `Math.round` is load-bearing: `CAREER_READING_LINE * 100` is
 * `70.00000000000001`, and that float would land verbatim in both trigger
 * strings. Deriving it here rather than in the island keeps one definition next
 * to the number it comes from.
 */
export const CAREER_READING_LINE_PERCENT = Math.round(CAREER_READING_LINE * 100);

/** Wrapper written by `CareerSpine.astro`; the island reaches the list through it. */
export const CAREER_SPINE_ROOT_SELECTOR = "[data-career-root]";
/** One per year group. Carries the year in the attribute value, so no text parsing. */
export const CAREER_YEAR_SELECTOR = "[data-career-year]";
/** One per event. Carries the event id, so a `#career-<id>` deep link can be resolved. */
export const CAREER_EVENT_SELECTOR = "[data-career-id]";

const YEAR_ANCHOR_PREFIX = "#career-year-";
const EVENT_ANCHOR_PREFIX = "#career-";

/** One year group as measured from the rendered page. */
export interface MeasuredYearGroup {
  year: number;
  /** Events in the group, for the stepper label. */
  count: number;
  /**
   * Document-space top edge (`getBoundingClientRect().top + scrollY` at read
   * time), not a viewport coordinate: recording it in document space is what
   * lets one measurement pass answer every later scroll without re-reading.
   */
  top: number;
}

/** `data-career-year="2026"` → `2026`. Rejects anything that is not a bare year. */
export function parseYearAttribute(value: string | null): number | null {
  if (value === null) return null;
  return /^\d{4}$/.test(value) ? Number(value) : null;
}

/** The anchor a year group answers to, matching the `id` Astro writes on its heading. */
export function yearAnchor(year: number): string {
  return `${YEAR_ANCHOR_PREFIX}${year}`;
}

/**
 * `#career-year-2025` → `2025`.
 *
 * Year anchors and event anchors share one prefix (`#career-`), so this is what
 * keeps `#career-year-2025` from being read as an event called `year-2025`.
 */
export function parseYearAnchor(hash: string): number | null {
  if (!hash.startsWith(YEAR_ANCHOR_PREFIX)) return null;
  return parseYearAttribute(hash.slice(YEAR_ANCHOR_PREFIX.length));
}

/** `#career-exp-ferswit` → `exp-ferswit`, or `null` for a year/foreign anchor. */
export function parseEventAnchor(hash: string): string | null {
  if (!hash.startsWith(EVENT_ANCHOR_PREFIX)) return null;
  const id = hash.slice(EVENT_ANCHOR_PREFIX.length);
  return id === "" || id.startsWith("year-") ? null : id;
}

/**
 * Do two readings describe the same year groups, in the same order, with the
 * same sizes?
 *
 * A resize produces a fresh reading every time, and a new array identity would
 * tear down and rebuild the ScrollTrigger mid-scroll — resetting the rule the
 * reader is watching. Comparing the *identity* of each group (year and how many
 * events it holds) but not the measured positions, which legitimately change on
 * resize, keeps the trigger alive and still refreshes the geometry.
 */
export function sameYearGroups(
  a: readonly { year: number; count: number }[],
  b: readonly { year: number; count: number }[],
): boolean {
  return (
    a.length === b.length &&
    a.every((group, index) => group.year === b[index]?.year && group.count === b[index]?.count)
  );
}

/**
 * Index of the year group the reading line is inside, or `-1` when there is none.
 *
 * The first group is the answer even above the line: the reader looking at the top
 * of the spine is looking at its newest year, not at "nothing yet".
 */
export function activeYearIndex(groups: MeasuredYearGroup[], readingLine: number): number {
  if (groups.length === 0) return -1;
  let index = 0;
  for (let i = 0; i < groups.length; i += 1) {
    if (groups[i].top <= readingLine) index = i;
    else break;
  }
  return index;
}

/**
 * How much of the rail's rule should be drawn, `0`–`1`.
 *
 * Linear between consecutive measured group tops, so the fill is proportional to
 * how far the reading line has actually travelled through the years rather than
 * to how far the page has scrolled overall. Discrete inputs, honest output: at
 * the exact top of year *i* the fill is `i / n`, and it reaches `1` only when the
 * line passes the last year's heading.
 */
export function spineFillFraction(groups: MeasuredYearGroup[], readingLine: number): number {
  const total = groups.length;
  if (total === 0) return 0;
  const first = groups[0].top;
  const last = groups[total - 1].top;
  if (readingLine <= first) return 0;
  if (readingLine >= last) return 1;
  for (let i = 0; i < total - 1; i += 1) {
    const from = groups[i].top;
    const to = groups[i + 1].top;
    if (readingLine < from || readingLine > to) continue;
    const span = to - from;
    const progress = span > 0 ? (readingLine - from) / span : 1;
    return (i + progress) / total;
  }
  return 1;
}
