import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { MeasuredYearGroup } from "../lib/creative/career-spine-select";
import {
  CAREER_EVENT_SELECTOR,
  CAREER_READING_LINE,
  CAREER_READING_LINE_PERCENT,
  CAREER_SPINE_ROOT_SELECTOR,
  CAREER_YEAR_SELECTOR,
  activeYearIndex,
  parseEventAnchor,
  parseYearAnchor,
  parseYearAttribute,
  sameYearGroups,
  spineFillFraction,
  yearAnchor,
} from "../lib/creative/career-spine-select";
import { ROVING_KEYS, rovingTargetIndex } from "../lib/creative/roving";
import type { RovingKey } from "../lib/creative/roving";
import { ScrollTrigger, gsap } from "../lib/gsap";

/**
 * Career Spine scrub (`#career`) — the enhancement layer on markup that already
 * works without it.
 *
 * THE SPINE IS SERVER-RENDERED. `CareerSpine.astro` prints all 26 records as a
 * plain `<ol>` grouped by year; this island never re-renders that list and never
 * receives it. It reads the year groups out of the DOM (`data-career-year`),
 * measures where each one starts, and then does two things:
 *
 * 1. draws a rail beside the list — a year stepper, plus a rule whose length is
 *    the fraction of the reading line's travel through the years; and
 * 2. lets the reader jump to a year (pointer, arrow keys, or a deep link).
 *
 * WHY IT TAKES NO PROPS. Passing `events` in would make this island import the
 * data contract, which imports the whole data layer — measured at 18.5 KB gzip
 * for one five-item string array (Q4.1 BUG FIX 1). The rendered page already
 * carries every fact the island needs, so the island's only imports are React,
 * motion, GSAP, and two pure helpers. That also makes the sprint's bundle gate
 * (`rg 'career-spine' dist/_astro/` = 0) true by construction rather than by
 * discipline.
 *
 * WHY A YEAR STEPPER AND NOT AN EVENT STEPPER. The PRD sketched a per-record
 * panel. A panel would have to hide the other 25 records to be honest, and the
 * canonical list staying complete is a hard requirement (Barrier B) — the same
 * reason the Case Study Reactor renders all five stages instead of one. So the
 * stepper's unit is the year group (4 of them, which is what a 13rem rail can
 * hold), every record keeps its own `#career-<id>` anchor, and the rail's marker
 * follows the reader down the list.
 *
 * SCROLL COST: zero new listeners. ScrollTrigger registers one `scroll` listener
 * per document with identical `{passive, capture}` options for every trigger, so
 * the browser deduplicates them — a second trigger adds none. There is also no
 * `requestAnimationFrame` loop here, so `useRafGuard` is deliberately absent
 * (M1.3.7: don't add a guard when there is no rAF to guard).
 */

/** The rail's static identity per year group: what a stepper button prints. */
interface YearEntry {
  year: number;
  /** Events in the group, counted from `data-career-id` children. */
  count: number;
}

/** Document-space y of the reading line — the space the measured tops live in. */
function readingLineNow(): number {
  if (typeof window === "undefined") return 0;
  return window.scrollY + window.innerHeight * CAREER_READING_LINE;
}

/** Spoken form of a jump, so a jump is announced and a scroll is not. */
function jumpAnnouncement(group: { year: number; count: number }): string {
  return `${group.year}: ${group.count} record${group.count === 1 ? "" : "s"}`;
}

export default function CareerSpine() {
  const [hydrated, setHydrated] = useState(false);
  const [years, setYears] = useState<YearEntry[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [status, setStatus] = useState("");
  const [lowData, setLowData] = useState(false);
  const prefersReduced = useReducedMotion() ?? false;

  const hostRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  /** Latest measurement, always current. Read by the scrub and by deep links. */
  const measuredRef = useRef<MeasuredYearGroup[]>([]);
  /**
   * The measured groups' elements, in the same order as `measuredRef`.
   *
   * A jump needs the element to scroll to, and re-querying the DOM for it would
   * index a *different* list: `measure()` drops groups whose `data-career-year`
   * is not a bare year, so the surviving groups are what the stepper counts.
   * Keeping the nodes beside the numbers is what stops "2025" from scrolling to
   * whichever unparseable group happens to sit at index 1.
   */
  const groupNodesRef = useRef<HTMLElement[]>([]);
  /** event id → year-group index, so a `#career-<id>` deep link resolves to a year. */
  const eventYearRef = useRef(new Map<string, number>());
  const buttonRefs = useRef(new Map<number, HTMLButtonElement>());
  const setRuleScale = useRef<((value: number) => void) | null>(null);
  const initialSyncDone = useRef(false);

  /**
   * The scrub is the only motion on this island, so both preferences remove all
   * of it and keep the navigation. `prefers-reduced-data` is read the same way
   * Signal Loom reads it; SSR has no `matchMedia`, hence the `false` default.
   */
  const scrubDisabled = prefersReduced || lowData;

  useEffect(() => {
    setHydrated(true);
    const found = hostRef.current?.closest(CAREER_SPINE_ROOT_SELECTOR) ?? null;
    rootRef.current = found instanceof HTMLElement ? found : null;
  }, []);

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-data: reduce)");
    if (!query) return;
    setLowData(query.matches);
    const onChange = (event: MediaQueryListEvent) => setLowData(event.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);

  /**
   * Mirror the active year onto the server-rendered group.
   *
   * Emphasis only — the group is never hidden or moved, so the canonical list
   * stays complete and the browser's own `#career-<id>` anchors keep working.
   */
  const markActive = useCallback((year: number | null) => {
    const root = rootRef.current;
    if (!root) return;
    for (const node of root.querySelectorAll<HTMLElement>(CAREER_YEAR_SELECTOR)) {
      if (year !== null && node.getAttribute("data-career-year") === String(year)) {
        node.setAttribute("data-career-active", "true");
      } else {
        node.removeAttribute("data-career-active");
      }
    }
  }, []);

  /**
   * Recompute the marker from the last measurement.
   *
   * Called after every measurement and from the scroll callback. The rule is
   * written through `gsap.quickSetter`, never React state: it changes on every
   * scroll frame, and a state write there would re-render the stepper 60 times a
   * second to move a 1px line. `activeIndex` does go through state, but the
   * functional bailout means it re-renders at most once per year boundary — 4
   * times for the whole spine.
   */
  const applyReadingLine = useCallback(() => {
    const measured = measuredRef.current;
    if (measured.length === 0) return;
    const line = readingLineNow();
    setRuleScale.current?.(spineFillFraction(measured, line));
    const index = activeYearIndex(measured, line);
    setActiveIndex((current) => (current === index ? current : index));
    markActive(measured[index]?.year ?? null);
  }, [markActive]);

  /**
   * One read pass: the document-space top of every year group.
   *
   * Only `getBoundingClientRect` costs anything; counts and event ids come from
   * attributes. Tops are stored in **document** space so every later scroll
   * frame is answered from this one array instead of a new layout read.
   *
   * The `years` identity is kept stable across resizes on purpose
   * (`sameYearGroups`): a fresh array would tear down and rebuild the
   * ScrollTrigger mid-scroll, resetting the rule the reader is watching. The
   * measured tops are refreshed regardless — they live in a ref, not in state.
   */
  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const scrollY = window.scrollY;
    const measured: MeasuredYearGroup[] = [];
    const nodes: HTMLElement[] = [];
    const nextYears: YearEntry[] = [];
    const eventYears = new Map<string, number>();

    for (const node of root.querySelectorAll<HTMLElement>(CAREER_YEAR_SELECTOR)) {
      const year = parseYearAttribute(node.getAttribute("data-career-year"));
      if (year === null) continue;
      const events = node.querySelectorAll(CAREER_EVENT_SELECTOR);
      for (const event of events) {
        const id = event.getAttribute("data-career-id");
        if (id !== null) eventYears.set(id, nextYears.length);
      }
      nextYears.push({ year, count: events.length });
      nodes.push(node);
      measured.push({
        year,
        count: events.length,
        top: node.getBoundingClientRect().top + scrollY,
      });
    }

    measuredRef.current = measured;
    groupNodesRef.current = nodes;
    eventYearRef.current = eventYears;
    setYears((current) => (sameYearGroups(current, nextYears) ? current : nextYears));
    // With no scrub there is no position to derive a marker from, so the spine is
    // simply left unmarked until the reader jumps.
    if (!scrubDisabled) applyReadingLine();
  }, [applyReadingLine, scrubDisabled]);

  // The first read waits one frame and the observer's initial notification is
  // skipped: hydration has just written to the DOM, so measuring in that same
  // frame would interleave layout reads with those writes — the read-after-write
  // pattern MotionScore reports as mount thrashing. One read per layout pass.
  useEffect(() => {
    if (!hydrated) return;
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    let initialNotification = true;
    const observer = new ResizeObserver(() => {
      if (initialNotification) {
        initialNotification = false;
        return;
      }
      measure();
    });
    observer.observe(root);
    const frame = requestAnimationFrame(measure);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [hydrated, measure]);

  /**
   * The scrub. `ScrollTrigger` already batches on scroll and shares its single
   * document listener, so this adds no `scroll` handler of our own; there is no
   * tween either — the rule's length is a pure function of the measured tops, so
   * the fill can never disagree with the year it marks.
   *
   * Cleanup kills the trigger by reference (M1.3.6). `ScrollTrigger.getAll()`
   * would kill every trigger on the page, including the neighbouring Journey
   * Timeline's, whose owner would never rebuild it because its own dependencies
   * did not change — that is Task 0.7's permanent-damage bug, and it must not
   * come back here.
   *
   * The single `applyReadingLine()` after creation paints the first frame, and it
   * is not redundant: the measurement pass runs one frame *before* the rail exists,
   * so at that moment there is no rule element to write to. Without this the fill
   * would sit at its CSS zero until the reader's next scroll — invisible on a page
   * loaded at the top, and a stuck empty rail for a reader who arrives on a deep
   * link with the scroll already halfway down.
   *
   * DECLARED BEFORE `syncFromHash` ON PURPOSE. Both effects run in the same commit
   * that first fills `years`, and this one marks the year the *scroll* is at, while
   * the deep-link sync marks the year the reader *asked for*. In declaration order
   * the deep link wins, because a reader who arrives at `#career-<id>` has already
   * been scrolled there by the browser and a rail disagreeing with the viewport
   * reads as a bug. The scrub takes the marker back on the first real scroll
   * frame, which is correct: past that point the reader, not the URL, is moving.
   */
  useEffect(() => {
    if (!hydrated || scrubDisabled) return;
    const root = rootRef.current;
    if (!root || years.length === 0) return;
    const trigger = ScrollTrigger.create({
      trigger: root,
      start: `top ${CAREER_READING_LINE_PERCENT}%`,
      end: `bottom ${CAREER_READING_LINE_PERCENT}%`,
      onUpdate: applyReadingLine,
    });
    applyReadingLine();
    return () => trigger.kill();
  }, [hydrated, scrubDisabled, years, applyReadingLine]);

  /**
   * Deep links, read once on mount and then on `hashchange`.
   *
   * The mount read is silent — the browser already scrolled there, and speaking
   * over the page the reader just asked for helps nobody. A later `hashchange`
   * is a deliberate jump and is announced. `years` is a dependency only so the
   * first read happens *after* the measurement pass that fills
   * `measuredRef`/`eventYearRef`; the guard below keeps it to once, so a resize
   * cannot re-apply a stale hash over a marker the reader has since moved.
   *
   * Declared after the scrub effect so it has the last word on mount — see the
   * ordering note there.
   */
  const syncFromHash = useCallback(
    (announce: boolean) => {
      const groups = measuredRef.current;
      if (groups.length === 0) return;
      const hash = window.location.hash;
      const year = parseYearAnchor(hash);
      const eventId = parseEventAnchor(hash);
      const index =
        year !== null
          ? groups.findIndex((group) => group.year === year)
          : eventId === null
            ? -1
            : (eventYearRef.current.get(eventId) ?? -1);
      const group = groups[index];
      if (!group) return;
      setActiveIndex(index);
      markActive(group.year);
      if (announce) setStatus(jumpAnnouncement(group));
    },
    [markActive],
  );

  useEffect(() => {
    if (!hydrated || years.length === 0) return;
    if (!initialSyncDone.current) {
      initialSyncDone.current = true;
      syncFromHash(false);
    }
    const onHashChange = () => syncFromHash(true);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [hydrated, years, syncFromHash]);

  /** Jump to a year group. `behavior: "auto"` is instant, so it is not motion. */
  const jumpTo = useCallback(
    (index: number) => {
      const root = rootRef.current;
      const entry = years[index];
      const node = groupNodesRef.current[index];
      if (!root || !entry || !node) return;
      // `behavior: "auto"` defers to the computed `scroll-behavior`, and
      // `global.css` sets `html { scroll-behavior: smooth }` — so this jump
      // *animates*, measured at 6291 → 176 over ~1s. Deliberate, and the same as
      // every in-page anchor on the site including the `#career-<id>` deep links
      // this rail jumps to. Under `prefers-reduced-motion` the same call is
      // instant, because the repo's own reduced-motion block sets
      // `scroll-behavior: auto !important` (global.css:272) — which is also why
      // the option is `"auto"` and not `"instant"`: an unknown enum value throws
      // in older engines, and the preference is handled where it belongs.
      node.scrollIntoView({ block: "start", behavior: "auto" });
      setActiveIndex(index);
      markActive(entry.year);
      window.history.replaceState(null, "", yearAnchor(entry.year));
      setStatus(jumpAnnouncement(entry));
    },
    [years, markActive],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!ROVING_KEYS.has(event.key)) return;
    event.preventDefault();
    const target = rovingTargetIndex(activeIndex, years.length, event.key as RovingKey);
    if (target < 0) return;
    jumpTo(target);
    buttonRefs.current.get(target)?.focus();
  };

  const attachRule = useCallback((element: HTMLSpanElement | null) => {
    // `quickSetter` is typed to return `Function`; the contract it returns for
    // one property is a `(value: number) => void`, which is what the ref holds.
    setRuleScale.current = element
      ? (gsap.quickSetter(element, "scaleY") as (value: number) => void)
      : null;
  }, []);

  useEffect(() => {
    return () => markActive(null);
  }, [markActive]);

  return (
    <div ref={hostRef} data-career-rail-host="">
      {hydrated && years.length > 0 && (
        <>
          <div className="flex items-stretch gap-3" data-career-rail="">
            {!scrubDisabled && (
              /* Track + fill. `absolute` so the drawn rule can never change the
                 rail's height, which would change the grid row height and shift
                 the list next to it. */
              <span aria-hidden="true" className="relative w-px shrink-0 bg-border">
                <span
                  ref={attachRule}
                  data-career-rule=""
                  className="absolute inset-0 origin-top scale-y-0 bg-brand"
                />
              </span>
            )}
            <ul
              data-career-stepper=""
              aria-label="Jump to a year"
              className="m-0 flex list-none flex-col gap-1 p-0"
              onKeyDown={handleKeyDown}
            >
              {years.map((entry, index) => {
                const isActive = index === activeIndex;
                return (
                  <li key={entry.year} className="m-0">
                    <button
                      ref={(element) => {
                        if (element) buttonRefs.current.set(index, element);
                        else buttonRefs.current.delete(index);
                      }}
                      type="button"
                      data-career-step={entry.year}
                      aria-current={isActive ? "true" : undefined}
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => jumpTo(index)}
                      className={`w-full rounded px-2 py-1 text-left font-mono text-sm tabular-nums transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary ${
                        isActive
                          ? "text-brand"
                          : "text-text-secondary/70 hover:bg-brand/10 hover:text-brand"
                      }`}
                    >
                      {entry.year}
                      <span className="ml-2 text-xs tabular-nums text-text-secondary/50">
                        {entry.count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <p data-career-status="" aria-live="polite" className="sr-only">
            {status}
          </p>
        </>
      )}
    </div>
  );
}
