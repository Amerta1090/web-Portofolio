/**
 * Career Spine data contract (`#career`).
 *
 * One ordered list of dated events replacing three separate sections: the
 * `Experience` cards, the `JourneyTimeline` scrub, and — from M1.4 — honors and
 * volunteering. Pure and deterministic: no clock, no randomness, no I/O. Same
 * input data ⇒ byte-identical output, so the spine can be asserted in tests and
 * compared against `dist` in the build (M1.2.4).
 *
 * WHY NOT `getTimeline()`: it emits a `TimelineItem` shaped for one page
 * (`/timeline`) and its id/label strings are baked in at the call site. The
 * spine needs four kinds, a machine-readable date and an honest drop list, and it
 * must be the single place the certification cap lives.
 *
 * BUNDLE RULE (measured once already, see Q4.1 BUG FIX 1): this module imports
 * the whole data layer. The island must import **types only** from here — kinds
 * and labels come from `career-spine-ids.ts`, which has no imports at all.
 */

import type { Certification } from "../../types/certifications";
import type { Experience } from "../../types/experience";
import type { Honor } from "../../types/honors";
import type { Volunteering } from "../../types/volunteering";
import { getCertifications, getExperience, getHonors, getVolunteering } from "../data";
import {
  CAREER_EVENT_KINDS,
  CAREER_EVENT_KIND_LABELS,
  type CareerEventKind,
} from "./career-spine-ids";

export { CAREER_EVENT_KINDS, CAREER_EVENT_KIND_LABELS };
export type { CareerEventKind };

/**
 * How many dated certifications the spine shows.
 *
 * This is a **product decision, not a fact about the data**: 61 of the 62
 * certifications carry a date. A 68-entry spine reads worse than a 26-entry one,
 * and the full list already has a home (`#certifications`, bento by issuer), so
 * the spine carries a reference sample instead of a second copy (PRD §9.8).
 *
 * It was previously a bare `slice(0, 15)` inside `getTimeline()`, which took the
 * *first* 15 entries in file order — that only equals "the newest 15" because
 * `certifications.json` happens to be sorted newest-first, an invariant nothing
 * documented or tested. Here the newest are selected **by date**, so a future
 * reshuffle of that file cannot silently change which certifications the spine
 * shows.
 *
 * `src/lib/facts.ts` re-exports this constant so existing importers keep
 * working and the number still has exactly one definition (P8).
 */
export const TIMELINE_CERTIFICATION_LIMIT = 15;

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * A date exactly as precise as the source data.
 *
 * `precision` is why the field exists at all. `<time datetime>` accepts a month
 * string ("2025-10") but **not** a bare year, so year-only records (all three
 * honors) must not be handed a fabricated January. `month` stays `null` when the
 * source never said, and `careerDateTimeValue()` returns `null` rather than
 * inventing precision.
 */
export interface CareerDate {
  year: number;
  /** 0-11, or `null` when the source only carried a year. */
  month: number | null;
  precision: "month" | "year";
  /** Machine value ("2024-05" / "2024"). Valid for `datetime` only at month precision. */
  iso: string;
  /** Monotonic sort key: `year * 12 + (month ?? 0)`. A year-only record sorts as January. */
  sortKey: number;
}

/**
 * Parse the ISO-shaped dates this data layer stores: `YYYY` or `YYYY-MM`.
 *
 * Reusing `parsePeriod()` from `src/lib/observatory/parsePeriod.ts` was the plan
 * (P3: don't reimplement a tested parser) and was checked against the real data
 * first — it cannot be used. That parser accepts `"Mon YYYY – Mon YYYY"`
 * (project periods, "Sep 2024 – Jan 2025"), while every dated record here is
 * `YYYY-MM` or `YYYY`. A second copy of its month table would be a third parser
 * for the same idea. The private `parseDate()` in `src/lib/data.ts` does parse
 * these shapes, but it is `getTimeline()`'s own helper and both callers disappear
 * with that function in M1.5, so folding it in here leaves exactly one.
 *
 * Strict: month must be 01-12, year must be a real number, no separators beyond
 * one hyphen, no prose. Anything else is `null`, and callers must drop the event
 * rather than guess a position for it.
 */
export function parseCareerDate(raw: string | null | undefined): CareerDate | null {
  if (typeof raw !== "string") return null;
  const match = raw.trim().match(/^(\d{4})(?:-(\d{2}))?$/);
  if (!match) return null;
  const year = Number.parseInt(match[1], 10);
  if (!Number.isInteger(year) || year <= 0) return null;
  if (match[2] === undefined) {
    return { year, month: null, precision: "year", iso: `${year}`, sortKey: year * 12 };
  }
  const month = Number.parseInt(match[2], 10) - 1;
  if (!(month >= 0 && month <= 11)) return null;
  return {
    year,
    month,
    precision: "month",
    iso: `${year}-${match[2]}`,
    sortKey: year * 12 + month,
  };
}

/** "Oct 2025" at month precision, "2024" at year precision. Never guesses a month. */
export function formatCareerDate(date: CareerDate): string {
  return date.month === null ? `${date.year}` : `${MONTH_LABELS[date.month]} ${date.year}`;
}

/**
 * The value to put in a `<time datetime>` attribute, or `null` when the source
 * was not precise enough to have one. Returning `null` instead of "2024" is the
 * point: a year-only record has no valid month string, and padding it with
 * January would put a date on the page that nobody wrote down.
 */
export function careerDateTimeValue(date: CareerDate): string | null {
  return date.precision === "month" ? date.iso : null;
}

export interface CareerEvent {
  /** Stable and unique; deep links address `#career-<id>`. */
  id: string;
  kind: CareerEventKind;
  title: string;
  /** Company, issuer, awarding event, or organisation. `null` when absent/blank. */
  org: string | null;
  /** When the event happened (or when it started). Always present — undated records are dropped. */
  date: CareerDate;
  /** End of a span; `null` for a point in time or an ongoing span. */
  end: CareerDate | null;
  /** True only for a span with no recorded end. */
  ongoing: boolean;
  /** Display string, formatted here so no renderer hand-rolls a month table. */
  periodLabel: string;
  highlights: string[];
  tags: string[];
  url: string | null;
  image: string | null;
  /**
   * The one secondary line each replaced section already printed: engagement ·
   * location for experience, cause for volunteering, `null` elsewhere.
   */
  meta: string | null;
}

export type CareerDropReason = "undated" | "over-cap";

/** A record that exists in the data layer but has no place on the spine. */
export interface DroppedCareerEvent {
  kind: CareerEventKind;
  title: string;
  reason: CareerDropReason;
}

export interface CareerEventBuild {
  events: CareerEvent[];
  /**
   * Reported rather than silently discarded, and split by reason: `undated`
   * cannot be positioned at all, `over-cap` is a display decision. Collapsing
   * the two into one number is how a cap starts reading as a data limit.
   */
  dropped: DroppedCareerEvent[];
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function nonEmpty(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function spanLabel(start: CareerDate, end: CareerDate | null, ongoing: boolean): string {
  if (end === null) {
    return ongoing ? `${formatCareerDate(start)} – Present` : formatCareerDate(start);
  }
  if (end.sortKey === start.sortKey) return formatCareerDate(start);
  return `${formatCareerDate(start)} – ${formatCareerDate(end)}`;
}

function toEvent(
  base: Omit<CareerEvent, "date" | "end" | "ongoing" | "periodLabel">,
  rawDate: string | null | undefined,
  rawEnd: string | null | undefined,
  isSpan: boolean,
): CareerEvent | DroppedCareerEvent {
  const date = parseCareerDate(rawDate);
  if (!date) {
    return { kind: base.kind, title: base.title, reason: "undated" };
  }
  const end = isSpan ? parseCareerDate(rawEnd) : null;
  return {
    ...base,
    date,
    end,
    ongoing: isSpan && !rawEnd,
    periodLabel: spanLabel(date, end, isSpan && !rawEnd),
  };
}

function experienceEvent(exp: Experience): CareerEvent | DroppedCareerEvent {
  return toEvent(
    {
      id: `exp-${exp.id}`,
      kind: "experience",
      title: exp.role,
      org: nonEmpty(exp.company),
      highlights: exp.highlights,
      tags: exp.technologies,
      url: exp.url,
      image: exp.logo ?? null,
      meta: [nonEmpty(exp.type), nonEmpty(exp.location)].filter(Boolean).join(" · ") || null,
    },
    exp.start_date,
    exp.end_date,
    true,
  );
}

function certificationEvent(cert: Certification): CareerEvent | DroppedCareerEvent {
  return toEvent(
    {
      id: `cert-${slug(cert.title)}`,
      kind: "certification",
      title: cert.title,
      org: nonEmpty(cert.issuer),
      highlights: [],
      tags: cert.skills,
      url: cert.url,
      image: cert.badge ?? null,
      meta: null,
    },
    cert.date,
    null,
    false,
  );
}

function honorEvent(honor: Honor): CareerEvent | DroppedCareerEvent {
  return toEvent(
    {
      id: `honor-${slug(honor.title)}`,
      kind: "honor",
      title: honor.title,
      org: nonEmpty(honor.event),
      highlights: honor.description ? [honor.description] : [],
      tags: nonEmpty(honor.category) ? [honor.category] : [],
      url: null,
      image: honor.image ?? null,
      meta: null,
    },
    honor.date,
    null,
    false,
  );
}

function volunteeringEvent(volunteering: Volunteering): CareerEvent | DroppedCareerEvent {
  return toEvent(
    {
      id: `volunteering-${slug(`${volunteering.role}-${volunteering.organization}`)}`,
      kind: "volunteering",
      title: volunteering.role,
      org: nonEmpty(volunteering.organization),
      highlights: volunteering.highlights,
      tags: [],
      url: null,
      image: null,
      meta: nonEmpty(volunteering.cause),
    },
    volunteering.start_date,
    volunteering.end_date,
    true,
  );
}

function isDropped(value: CareerEvent | DroppedCareerEvent): value is DroppedCareerEvent {
  return "reason" in value;
}

export interface SpineCertificationSelection {
  selected: Certification[];
  overCap: Certification[];
  /** Datedness is the reason for exclusion, so undated records are separated rather than lost. */
  undated: Certification[];
}

/**
 * The `limit` newest dated certifications, chosen by date rather than by array
 * position. Exported so the ordering guarantee can be tested with a shuffled
 * input instead of trusting the current file order.
 *
 * Returns all three buckets because the caller has to report what it left out:
 * "over the cap" and "no date at all" are different facts about a record, and
 * merging them into one counter is how a display cap starts reading as a data
 * limit.
 */
export function selectSpineCertifications(
  certifications: Certification[],
  limit: number = TIMELINE_CERTIFICATION_LIMIT,
): SpineCertificationSelection {
  const dated: { cert: Certification; date: CareerDate }[] = [];
  const undated: Certification[] = [];
  for (const cert of certifications) {
    const date = parseCareerDate(cert.date);
    if (date) dated.push({ cert, date });
    else undated.push(cert);
  }
  dated.sort((a, b) => b.date.sortKey - a.date.sortKey || a.cert.title.localeCompare(b.cert.title));
  return {
    selected: dated.slice(0, limit).map((entry) => entry.cert),
    overCap: dated.slice(limit).map((entry) => entry.cert),
    undated,
  };
}

export interface CareerEventSources {
  experience: Experience[];
  certifications: Certification[];
  honors: Honor[];
  volunteering: Volunteering[];
}

/**
 * Build the spine from already-loaded data. Pure, so a test can hand it
 * shuffled or degenerate input; `buildCareerEvents()` is the real-data entry.
 */
export function toCareerEvents(sources: CareerEventSources): CareerEventBuild {
  const { selected, overCap, undated } = selectSpineCertifications(sources.certifications);

  const dropped: DroppedCareerEvent[] = [];
  const events: CareerEvent[] = [];

  const push = (result: CareerEvent | DroppedCareerEvent) => {
    if (isDropped(result)) dropped.push(result);
    else events.push(result);
  };

  for (const exp of sources.experience) push(experienceEvent(exp));
  for (const cert of selected) push(certificationEvent(cert));
  for (const honor of sources.honors) push(honorEvent(honor));
  for (const volunteering of sources.volunteering) push(volunteeringEvent(volunteering));

  for (const cert of overCap) {
    dropped.push({ kind: "certification", title: cert.title, reason: "over-cap" });
  }
  for (const cert of undated) {
    dropped.push({ kind: "certification", title: cert.title, reason: "undated" });
  }

  const kindOrder = new Map(CAREER_EVENT_KINDS.map((kind, index) => [kind, index]));

  events.sort((a, b) => {
    return (
      b.date.sortKey - a.date.sortKey ||
      // Same month: experiences before certifications before honors before
      // volunteering, so the order never depends on which dataset ran first.
      (kindOrder.get(a.kind) ?? 0) - (kindOrder.get(b.kind) ?? 0) ||
      a.title.localeCompare(b.title) ||
      // Total order, so the sort is stable no matter how the engine implements it.
      a.id.localeCompare(b.id)
    );
  });

  return { events, dropped };
}

/** The spine from the real data layer. */
export function buildCareerEvents(): CareerEventBuild {
  return toCareerEvents({
    experience: getExperience(),
    certifications: getCertifications(),
    honors: getHonors(),
    volunteering: getVolunteering(),
  });
}

export interface CareerYearGroup {
  year: number;
  events: CareerEvent[];
}

/** Events bucketed by year, newest year first — the shape the spine renders. */
export function groupEventsByYear(events: CareerEvent[]): CareerYearGroup[] {
  const groups = new Map<number, CareerEvent[]>();
  for (const event of events) {
    const bucket = groups.get(event.date.year);
    if (bucket) bucket.push(event);
    else groups.set(event.date.year, [event]);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, grouped]) => ({ year, events: grouped }));
}

/** One tick per year present on the spine, newest first. */
export function yearTicks(events: CareerEvent[]): number[] {
  return groupEventsByYear(events).map((group) => group.year);
}
