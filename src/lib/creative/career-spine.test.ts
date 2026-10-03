import { describe, expect, it } from "vitest";
import type { Certification } from "../../types/certifications";
import type { Experience } from "../../types/experience";
import type { Honor } from "../../types/honors";
import type { Volunteering } from "../../types/volunteering";
import { getCertifications, getExperience, getHonors, getVolunteering } from "../data";
import {
  CAREER_EVENT_KINDS,
  TIMELINE_CERTIFICATION_LIMIT,
  buildCareerEvents,
  careerDateTimeValue,
  formatCareerDate,
  groupEventsByYear,
  parseCareerDate,
  selectSpineCertifications,
  toCareerEvents,
  yearTicks,
} from "./career-spine";

/**
 * Every number below was measured against the real data layer, not taken from
 * the plan (M1.1.4 says to write the real count after verifying it). The
 * numbers that are genuinely load-bearing are re-derived from the datasets in
 * the same test, so a data change fails loudly instead of quietly rewriting an
 * expectation.
 */

const { events: realEvents, dropped: realDropped } = buildCareerEvents();

/** `parseCareerDate` returns null for unreadable input; these cases all parse. */
function parsed(raw: string) {
  const value = parseCareerDate(raw);
  if (value === null) throw new Error(`expected ${JSON.stringify(raw)} to parse`);
  return value;
}

function cert(overrides: Partial<Certification> & { title: string }): Certification {
  return {
    issuer: "Issuer",
    date: "2025-01",
    credential_id: null,
    skills: [],
    url: null,
    ...overrides,
  };
}

function exp(overrides: Partial<Experience> & { id: string }): Experience {
  return {
    company: "Company",
    role: "Role",
    type: "full-time",
    start_date: "2024-01",
    end_date: "2024-06",
    location: "",
    highlights: [],
    technologies: [],
    url: null,
    ...overrides,
  };
}

function honor(overrides: Partial<Honor> & { title: string }): Honor {
  return { event: "Event", date: "2024", category: "competition", description: null, ...overrides };
}

function volunteering(overrides: Partial<Volunteering> & { role: string }): Volunteering {
  return {
    organization: "Org",
    cause: "Education",
    start_date: "2025-05",
    end_date: "2025-05",
    highlights: [],
    ...overrides,
  };
}

describe("parseCareerDate", () => {
  it("parses the two shapes the data layer actually stores", () => {
    expect(parseCareerDate("2024")).toEqual({
      year: 2024,
      month: null,
      precision: "year",
      iso: "2024",
      sortKey: 2024 * 12,
    });
    expect(parseCareerDate("2025-10")).toEqual({
      year: 2025,
      month: 9,
      precision: "month",
      iso: "2025-10",
      sortKey: 2025 * 12 + 9,
    });
  });

  it("rejects anything it cannot read verbatim instead of guessing", () => {
    // Guessing here is how a spine ends up with an event in the wrong month.
    for (const raw of [
      "",
      "  ",
      "20245",
      "2024-5",
      "2024-13",
      "2024-00",
      "Feb 2024",
      "2024/05",
      "0000",
    ]) {
      expect(parseCareerDate(raw), raw).toBeNull();
    }
    expect(parseCareerDate(null)).toBeNull();
    expect(parseCareerDate(undefined)).toBeNull();
  });

  it("sorts a year-only record as January, which the tie-breaks then resolve", () => {
    expect(parsed("2025").sortKey).toBe(parsed("2025-01").sortKey);
    expect(parsed("2025-02").sortKey).toBeGreaterThan(parsed("2025").sortKey);
  });
});

describe("careerDateTimeValue", () => {
  it("yields a valid <time datetime> only when the source had one", () => {
    // The plan assumed every event can carry `datetime`. It cannot: "2024" is not
    // a valid month or date string, and padding it with January would put a
    // date on the page nobody wrote down.
    expect(careerDateTimeValue(parsed("2025-10"))).toBe("2025-10");
    expect(careerDateTimeValue(parsed("2024"))).toBeNull();
  });

  it("labels a year-only record with the bare year", () => {
    expect(formatCareerDate(parsed("2024"))).toBe("2024");
    expect(formatCareerDate(parsed("2025-10"))).toBe("Oct 2025");
  });
});

describe("selectSpineCertifications", () => {
  it("takes the newest by date, not the first in array order", () => {
    // `getTimeline()` used `filter(c => c.date).slice(0, 15)`, which was only
    // "the newest 15" because certifications.json happens to be sorted. Shuffled
    // input must not change the outcome.
    const source = [
      cert({ title: "oldest", date: "2020-01" }),
      cert({ title: "newest", date: "2026-01" }),
      cert({ title: "middle", date: "2023-06" }),
    ];
    const { selected } = selectSpineCertifications(source, 2);
    expect(selected.map((c) => c.title)).toEqual(["newest", "middle"]);
  });

  it("reports undated and over-cap separately — they are different facts", () => {
    const { selected, overCap, undated } = selectSpineCertifications(
      [
        cert({ title: "a", date: "2025-01" }),
        cert({ title: "b", date: "2024-01" }),
        cert({ title: "no date", date: null }),
      ],
      1,
    );
    expect(selected.map((c) => c.title)).toEqual(["a"]);
    expect(overCap.map((c) => c.title)).toEqual(["b"]);
    expect(undated.map((c) => c.title)).toEqual(["no date"]);
  });
});

describe("buildCareerEvents — the real spine", () => {
  it("carries 26 events across all four kinds", () => {
    const byKind = Object.fromEntries(
      CAREER_EVENT_KINDS.map((kind) => [kind, realEvents.filter((e) => e.kind === kind).length]),
    );
    expect(byKind).toEqual({
      experience: 7,
      certification: TIMELINE_CERTIFICATION_LIMIT,
      honor: 3,
      volunteering: 1,
    });
    expect(realEvents).toHaveLength(26);
    // Re-derived from the datasets, so editing the data cannot silently make
    // this expectation true.
    expect(byKind.experience).toBe(getExperience().length);
    expect(byKind.honor).toBe(getHonors().length);
    expect(byKind.volunteering).toBe(getVolunteering().length);
    expect(byKind.certification).toBe(TIMELINE_CERTIFICATION_LIMIT);
  });

  it("accounts for every record in the data layer — nothing vanishes silently", () => {
    const certifications = getCertifications();
    const dated = certifications.filter((c) => c.date).length;
    expect(dated).toBe(61);
    expect(certifications).toHaveLength(62);

    const overCap = realDropped.filter((d) => d.reason === "over-cap");
    const undated = realDropped.filter((d) => d.reason === "undated");
    expect(overCap).toHaveLength(dated - TIMELINE_CERTIFICATION_LIMIT);
    expect(undated).toHaveLength(certifications.length - dated);
    expect(undated.map((d) => d.title)).toEqual([
      "EF SET English Certificate 72/100 (C2 Proficient)",
    ]);

    // 26 on the spine + 47 set aside === every dated/undated record that fed it.
    expect(realEvents.length + realDropped.length).toBe(
      getExperience().length +
        certifications.length +
        getHonors().length +
        getVolunteering().length,
    );
  });

  it("gives every event an id, a kind, a title, and a date", () => {
    for (const event of realEvents) {
      expect(event.id, event.title).toBeTruthy();
      expect(CAREER_EVENT_KINDS, event.id).toContain(event.kind);
      expect(event.title, event.id).toBeTruthy();
      expect(event.date.year, event.id).toBeGreaterThan(0);
    }
    // Deep links address `#career-<id>`, so a duplicate id would silently
    // hijack another event's anchor.
    expect(new Set(realEvents.map((e) => e.id)).size).toBe(realEvents.length);
  });

  it("records an org for every real event, and reports the ongoing one", () => {
    expect(realEvents.filter((e) => e.org === null)).toEqual([]);
    const ongoing = realEvents.filter((e) => e.ongoing);
    expect(ongoing.map((e) => e.id)).toEqual(["exp-ferswit"]);
    expect(ongoing[0].periodLabel).toBe("May 2026 – Present");
    expect(ongoing[0].end).toBeNull();
  });

  it("formats a span, a point, and an ongoing span without a dangling dash", () => {
    const labels = realEvents.map((e) => e.periodLabel);
    expect(labels).toContain("Sep 2024 – Jan 2026");
    expect(labels).toContain("Oct 2025");
    // All three honors carry only a year, so they are points, not spans.
    expect(labels.filter((l) => /^20\d\d$/.test(l))).toEqual(["2026", "2025", "2024"]);
    for (const label of labels) expect(label, label).not.toMatch(/–\s*$/);
  });

  it("orders newest first and never reorders when the input order changes", () => {
    const keys = realEvents.map((e) => e.date.sortKey);
    expect([...keys].sort((a, b) => b - a)).toEqual(keys);
    expect(realEvents[0].id).toBe("exp-ferswit");
    expect(realEvents.at(-1)?.id).toBe("exp-idcamp");

    const reversed = buildCareerEventsReversed();
    expect(reversed.map((e) => e.id)).toEqual(realEvents.map((e) => e.id));
  });

  it("is byte-identical across builds (M1.1.5)", () => {
    expect(JSON.stringify(buildCareerEvents())).toBe(
      JSON.stringify({ events: realEvents, dropped: realDropped }),
    );
  });

  it("groups by year, newest first", () => {
    expect(yearTicks(realEvents)).toEqual([2026, 2025, 2024, 2023]);
    expect(groupEventsByYear(realEvents).map((g) => [g.year, g.events.length])).toEqual([
      [2026, 2],
      [2025, 16],
      [2024, 7],
      [2023, 1],
    ]);
    // Every event lands in exactly one group.
    expect(groupEventsByYear(realEvents).reduce((n, g) => n + g.events.length, 0)).toBe(
      realEvents.length,
    );
  });
});

describe("toCareerEvents — degenerate and ambiguous input", () => {
  const empty = { experience: [], certifications: [], honors: [], volunteering: [] };

  it("returns an empty spine rather than inventing one", () => {
    expect(toCareerEvents(empty)).toEqual({ events: [], dropped: [] });
    expect(yearTicks([])).toEqual([]);
  });

  it("drops an undated record of any kind and names it", () => {
    const build = toCareerEvents({
      ...empty,
      experience: [exp({ id: "no-start", start_date: "sometime" })],
      honors: [honor({ title: "no date", date: "" })],
      volunteering: [volunteering({ role: "no start", start_date: "unknown" })],
    });
    expect(build.events).toEqual([]);
    expect(build.dropped.map((d) => [d.kind, d.reason])).toEqual([
      ["experience", "undated"],
      ["honor", "undated"],
      ["volunteering", "undated"],
    ]);
  });

  it("breaks same-month ties by kind, then title — never by dataset order", () => {
    const build = toCareerEvents({
      experience: [exp({ id: "e", start_date: "2025-05", end_date: "2025-05" })],
      certifications: [
        cert({ title: "Zebra", date: "2025-05" }),
        cert({ title: "Alpha", date: "2025-05" }),
      ],
      honors: [honor({ title: "Award", date: "2025-05" })],
      volunteering: [volunteering({ role: "Talk", start_date: "2025-05", end_date: "2025-05" })],
    });
    expect(build.events.map((e) => `${e.kind}:${e.title}`)).toEqual([
      "experience:Role",
      "certification:Alpha",
      "certification:Zebra",
      "honor:Award",
      "volunteering:Talk",
    ]);
  });

  it("sorts a year-only record as January, so it trails that year's later months", () => {
    // All three honors carry only a year. Anchoring them to January is a stated
    // convention rather than an accident: the spine reads newest-first, so a
    // year-only record lands at the end of its own year group instead of
    // drifting past 2026.
    const build = toCareerEvents({
      ...empty,
      honors: [honor({ title: "Award", date: "2025" })],
      volunteering: [volunteering({ role: "Talk", start_date: "2025-05", end_date: "2025-05" })],
    });
    expect(build.events.map((e) => e.kind)).toEqual(["volunteering", "honor"]);
  });

  it("does not read a blank org as a real one", () => {
    const build = toCareerEvents({ ...empty, experience: [exp({ id: "blank", company: "   " })] });
    expect(build.events[0].org).toBeNull();
  });
});

/** Every source reversed, to prove no part of the order comes from the datasets. */
function buildCareerEventsReversed() {
  const reverse = <T>(list: T[]) => [...list].reverse();
  return toCareerEvents({
    experience: reverse(getExperience()),
    certifications: reverse(getCertifications()),
    honors: reverse(getHonors()),
    volunteering: reverse(getVolunteering()),
  }).events;
}
