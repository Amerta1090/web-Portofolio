import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CareerSpine from "./CareerSpine";

/**
 * M1.3 — the desktop scrub on top of markup that already works without it.
 *
 * GSAP is NOT stubbed here (unlike `SignalLoom.test.tsx`): `src/test/setup.ts`
 * polyfills `matchMedia`, so the real `ScrollTrigger` registry is available, and
 * that is the only way to test M1.3.6 — cleanup must kill *its own* trigger and
 * leave the neighbour's alone. `useGSAP.test.tsx` established both observables
 * (registry membership, and `animation.scrollTrigger` as a life certificate);
 * here the trigger has no tween, so the registry itself is the observable.
 *
 * The island takes no props. Every fact it needs is read from the server-rendered
 * `[data-career-root]` subtree, so the fixture below is the Astro markup's
 * *contract*, not a mock of the island's inputs.
 */

let reducedMotion = false;

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return {
    ...actual,
    useReducedMotion: () => reducedMotion,
  };
});

// Imported after the mock so the island and the test share one ScrollTrigger
// registry, which is the point of asserting cleanup scope against it.
const { gsap, ScrollTrigger } = await import("../lib/gsap");

/** Tops in document space, matching the real spine's descending year order. */
const DOC_TOPS: Record<number, number> = { 2026: 1000, 2025: 1100, 2024: 1200, 2023: 1300 };

/**
 * The spine root's own box, which only ScrollTrigger reads.
 *
 * It spans the four year groups so the reading line is inside the trigger's
 * range for a realistic spread of scroll positions — a root that starts at 0
 * would put the whole range at negative scroll, and `onUpdate` would never fire.
 */
const ROOT_TOP = 900;
const ROOT_HEIGHT = 1600;

/** The fixture mirrors `CareerSpine.astro`: one group per year, ids inside. */
const GROUPS: { year: number; ids: string[] }[] = [
  { year: 2026, ids: ["exp-a", "exp-b"] },
  { year: 2025, ids: ["cert-a", "cert-b", "cert-c"] },
  { year: 2024, ids: ["cert-d"] },
  { year: 2023, ids: ["honor-a"] },
];

/** Marks the element React creates the island root on. */
const ISLAND_CONTAINER_ATTRIBUTE = "data-island-root";

let reads: Element[] = [];
let scrollY = 0;
let restoreScroll: () => void = () => {};

/**
 * jsdom has no layout and no scroll position that the rest of the world can see.
 *
 * `window.scrollY` is a writable own property, but GSAP reads scroll through
 * `window.pageYOffset` (falling back to `documentElement.scrollTop`), and jsdom
 * keeps those separate — setting `scrollY` moves only the first. Both are bound
 * to one variable here so the island's own `readingLineNow()` and ScrollTrigger's
 * scroll function cannot disagree, which would make the scrub untestable.
 */
function stubScrollPosition() {
  const bound: [object, string][] = [
    [window, "scrollY"],
    [window, "pageYOffset"],
    [document.documentElement, "scrollTop"],
    [document.documentElement, "scrollY"],
  ];
  const originals = bound.map(
    ([target, name]) => [target, name, Object.getOwnPropertyDescriptor(target, name)] as const,
  );
  scrollY = 0;
  for (const [target, name] of bound) {
    Object.defineProperty(target, name, {
      configurable: true,
      get: () => scrollY,
      set: (value: number) => {
        scrollY = value;
      },
    });
  }
  restoreScroll = () => {
    for (const [target, name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(target, name, descriptor);
      else Reflect.deleteProperty(target, name);
    }
  };
}

function setScrollPosition(value: number) {
  scrollY = value;
}

/**
 * jsdom has no layout, so every `getBoundingClientRect()` returns zeroes and the
 * scrub arithmetic has nothing to work with. This gives each year group a
 * viewport `top` derived from its document-space top and the current scroll, so
 * `top + scrollY` recovers the fixture value — the same arithmetic the browser
 * would do.
 *
 * Every call is recorded, so the "one read pass" contract is measurable.
 */
function stubRects() {
  return vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (
    this: Element,
  ) {
    reads.push(this);
    const year = Number(this.getAttribute("data-career-year"));
    const isYearGroup = this.hasAttribute("data-career-year") && !Number.isNaN(year);
    const documentTop = isYearGroup ? (DOC_TOPS[year] ?? ROOT_TOP) : ROOT_TOP;
    const height = isYearGroup ? 200 : ROOT_HEIGHT;
    const top = documentTop - scrollY;
    return {
      top,
      bottom: top + height,
      left: 0,
      right: 0,
      width: 0,
      height,
      x: 0,
      y: top,
      toJSON: () => ({}),
    } as DOMRect;
  });
}

/** Reads limited to year groups — ScrollTrigger also measures the spine root. */
function yearGroupReads(): number {
  return reads.filter((element) => element.hasAttribute("data-career-year")).length;
}

/**
 * A `ResizeObserver` whose notifications are delivered by hand.
 *
 * `disconnect()` forgets the callback, so a notification after unmount is a
 * no-op exactly as a real observer's would be — otherwise the read-count test
 * would measure a pass that cannot happen in a browser.
 */
function mockResizeObserver(): { notify: () => void; restore: () => void } {
  const original = globalThis.ResizeObserver;
  let callback: ResizeObserverCallback | null = null;
  class ControllableResizeObserver {
    constructor(cb: ResizeObserverCallback) {
      callback = cb;
    }
    observe() {}
    unobserve() {}
    disconnect() {
      callback = null;
    }
  }
  globalThis.ResizeObserver = ControllableResizeObserver as unknown as typeof ResizeObserver;
  return {
    notify: () => callback?.([], {} as ResizeObserver),
    restore: () => {
      globalThis.ResizeObserver = original;
    },
  };
}

/** `matchMedia` that answers one query and stays quiet for the rest. */
function stubMedia(matchingQuery: string, matches: boolean): () => void {
  const original = window.matchMedia;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query.includes(matchingQuery) ? matches : false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
  return () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: original,
    });
  };
}

/** Build the server-rendered subtree and render the island inside it. */
function renderSpine(groups: { year: number; ids: string[] }[] = GROUPS) {
  const root = document.createElement("div");
  root.setAttribute("data-career-root", "");
  for (const group of groups) {
    const yearNode = document.createElement("li");
    yearNode.setAttribute("data-career-year", String(group.year));
    const events = document.createElement("ol");
    for (const id of group.ids) {
      const event = document.createElement("li");
      event.setAttribute("data-career-id", id);
      events.appendChild(event);
    }
    yearNode.appendChild(events);
    root.appendChild(yearNode);
  }
  const host = document.createElement("div");
  // React creates the root here, so this attribute is how the listener test tells
  // React's own capture wiring apart from anything the island registers.
  host.setAttribute(ISLAND_CONTAINER_ATTRIBUTE, "");
  root.appendChild(host);
  document.body.appendChild(root);
  return render(<CareerSpine />, { container: host });
}

/**
 * A fixture with one unparseable `data-career-year` wedged into the DOM.
 *
 * The Astro template cannot produce this today, but it is the only shape in which
 * "the groups the stepper lists" and "the nodes in the DOM at those positions"
 * can disagree: the measurement pass skips the malformed group, so every later
 * index is off by one if the island re-queries the DOM for a scroll target
 * instead of keeping the nodes it measured. The returned element is the node a
 * naive index would land on.
 */
function renderSpineWithMalformedYear() {
  renderSpine([
    { year: 2026, ids: ["exp-a"] },
    { year: 1999, ids: ["bogus"] },
    { year: 2024, ids: ["cert-a"] },
  ]);
  const malformed = document.createElement("li");
  malformed.setAttribute("data-career-year", "not-a-year");
  malformed.scrollIntoView = vi.fn();
  document.querySelector("[data-career-root]")?.insertBefore(malformed, yearNodes()[1]);
  return malformed;
}

function stepper() {
  return document.querySelector("[data-career-stepper]");
}

function steps() {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("[data-career-step]"));
}

function yearNodes() {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-career-year]"));
}

function statusText(): string {
  return document.querySelector("[data-career-status]")?.textContent ?? "";
}

/**
 * The rule's drawn length, read back through the transform GSAP wrote.
 *
 * Read with `gsap.getProperty`, not by parsing `style.transform`: GSAP drops the
 * scale once it is the identity and writes the bare `translate(0, 0)` instead, so
 * a regex finds a `scale()` only while the value is *not* 1 — which makes "the
 * rule is fully drawn" the one reading that cannot be asserted by parsing.
 */
function ruleScaleY(): number {
  const rule = document.querySelector<HTMLElement>("[data-career-rule]");
  if (!rule) return Number.NaN;
  return Number(gsap.getProperty(rule, "scaleY"));
}

/**
 * Render and wait for the island to be past its first measurement pass.
 *
 * Waiting only for the stepper is not enough: the stepper appears when `years`
 * is set, and the marker, the fill and the deep-link sync all land in the same
 * deferred read. `yearGroupReads()` is that read, counted rather than slept on.
 */
async function hydrate(groups?: { year: number; ids: string[] }[]) {
  const view = renderSpine(groups);
  await waitFor(() => expect(stepper()).not.toBeNull());
  await waitFor(() => expect(yearGroupReads()).toBeGreaterThan(0));
  return view;
}

/**
 * Record every listener registered while installed, with its target.
 *
 * Patching `EventTarget.prototype` alone is not enough, and the reason is
 * measurable rather than obvious: in this environment `addEventListener` is an
 * **own** property of `window`, so the window's own copy shadows the prototype
 * method and every `window.addEventListener` call — the island's `hashchange`
 * included — lands outside the patch. That is why the positive control below is
 * worth keeping: without it this tracker would have reported "the island adds no
 * listeners of any kind" while blind to half of them.
 *
 * Installed before the render rather than read afterwards: `vi.spyOn(...).mock.calls`
 * would be empty because the render has already happened.
 */
function trackAddedListeners() {
  const added: { type: string; target: EventTarget; capture: boolean }[] = [];
  const record = (
    target: EventTarget,
    type: string,
    options?: boolean | AddEventListenerOptions,
  ): void => {
    added.push({
      type,
      target,
      capture: typeof options === "object" ? Boolean(options?.capture) : Boolean(options),
    });
  };

  const originalProto = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (
    this: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ) {
    record(this, type, options);
    originalProto.call(this, type, listener, options);
  } as EventTarget["addEventListener"];

  const windowDescriptor = Object.getOwnPropertyDescriptor(window, "addEventListener");
  const originalWindow = window.addEventListener;
  Object.defineProperty(window, "addEventListener", {
    configurable: true,
    writable: true,
    value: function (
      this: EventTarget,
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ) {
      record(this, type, options);
      // The DOM ignores a null listener; the lib type does not accept one.
      if (listener === null) return;
      return originalWindow.call(this, type, listener, options);
    },
  });

  return {
    added,
    restore: () => {
      EventTarget.prototype.addEventListener = originalProto;
      if (windowDescriptor) {
        Object.defineProperty(window, "addEventListener", windowDescriptor);
      } else {
        Reflect.deleteProperty(window, "addEventListener");
      }
    },
  };
}

beforeEach(() => {
  reducedMotion = false;
  reads = [];
  stubScrollPosition();
  // Installed for its `getBoundingClientRect` mock; the call count is read off
  // the shared `reads` array, so no handle is kept. `vi.restoreAllMocks`
  // below uninstalls the spy.
  stubRects();
  window.history.replaceState(null, "", window.location.pathname);
  document.body.innerHTML = "";
  // jsdom implements neither of these, and both are the island's own calls.
  Element.prototype.scrollIntoView = vi.fn();
  for (const trigger of ScrollTrigger.getAll()) trigger.kill();
  // Warm ScrollTrigger's own scroller bookkeeping, so the listener test measures
  // the island rather than GSAP's one-time wiring for the document scroller.
  ScrollTrigger.create({
    trigger: document.body,
    start: "top bottom",
    end: "bottom top",
    onUpdate: () => {},
  }).kill();
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  restoreScroll();
});

describe("CareerSpine before hydration", () => {
  // `render()` flushes effects and flips the island to hydrated, so the server
  // render is the only way to observe the pre-hydration contract — the same
  // technique Q4.2 used for Signal Loom's fallback cards.
  it("renders no control and no rule — nothing dead without JavaScript", () => {
    const html = renderToStaticMarkup(<CareerSpine />);
    expect(html).not.toContain("<button");
    expect(html).not.toContain("data-career-stepper");
    expect(html).not.toContain("data-career-rule");
    expect(html).not.toContain("data-career-status");
    // The host stays, so the Astro grid cell is occupied before hydration and
    // the list is never pushed sideways when the rail appears.
    expect(html).toContain("data-career-rail-host");
  });
});

describe("CareerSpine after hydration", () => {
  it("builds one stepper button per year group, read from the rendered page", async () => {
    await hydrate();
    const buttons = steps();
    expect(buttons.map((button) => button.getAttribute("data-career-step"))).toEqual([
      "2026",
      "2025",
      "2024",
      "2023",
    ]);
    // Counts come from the rendered `[data-career-id]` children, so a year that
    // gains or loses a record re-renders without the island knowing anything else.
    expect(buttons.map((button) => button.textContent)).toEqual([
      "20262",
      "20253",
      "20241",
      "20231",
    ]);
    expect(stepper()?.getAttribute("aria-label")).toBe("Jump to a year");
  });

  it("keeps a single tab stop and marks the first year before any reading", async () => {
    await hydrate();
    const buttons = steps();
    expect(buttons.filter((button) => button.getAttribute("tabindex") === "0")).toHaveLength(1);
    expect(buttons[0]).toHaveAttribute("aria-current", "true");
    expect(buttons[0]).toHaveAttribute("tabindex", "0");
    expect(buttons[1]).toHaveAttribute("tabindex", "-1");
    expect(buttons[1]).not.toHaveAttribute("aria-current");
  });

  it("marks the newest year on the server-rendered group", async () => {
    await hydrate();
    // At scroll 0 the reading line sits above every group, so the reader is
    // looking at the newest year — emphasis only, the group is never hidden.
    expect(yearNodes()[0]).toHaveAttribute("data-career-active", "true");
    expect(yearNodes()[1]).not.toHaveAttribute("data-career-active");
  });

  it("skips a year group whose attribute is not a bare year", async () => {
    renderSpineWithMalformedYear();
    await waitFor(() => expect(yearGroupReads()).toBeGreaterThan(0));

    expect(steps().map((button) => button.getAttribute("data-career-step"))).toEqual([
      "2026",
      "1999",
      "2024",
    ]);
    expect(steps().map((button) => button.textContent)).toEqual(["20261", "19991", "20241"]);
    expect(document.querySelector('[data-career-year="not-a-year"]')).not.toHaveAttribute(
      "data-career-active",
    );
  });
});

describe("CareerSpine jumps", () => {
  it("scrolls to the chosen year, marks it, and announces the jump", async () => {
    const user = userEvent.setup();
    await hydrate();

    await user.click(screen.getByRole("button", { name: /2025/ }));

    const scrolled = vi.mocked(Element.prototype.scrollIntoView);
    expect(scrolled).toHaveBeenCalledTimes(1);
    expect(yearNodes()[1]).toHaveAttribute("data-career-active", "true");
    expect(yearNodes()[0]).not.toHaveAttribute("data-career-active");
    expect(steps()[1]).toHaveAttribute("aria-current", "true");
    expect(steps()[0]).toHaveAttribute("tabindex", "-1");
    expect(window.location.hash).toBe("#career-year-2025");
    expect(statusText()).toBe("2025: 3 records");
  });

  it("scrolls the element it measured, not one at the same index in the DOM", async () => {
    const user = userEvent.setup();
    const malformed = renderSpineWithMalformedYear();
    await waitFor(() => expect(yearGroupReads()).toBeGreaterThan(0));

    // 2024 is stepper index 2, but it is the *fourth* `[data-career-year]` node,
    // because the malformed group sits at index 2 in the DOM.
    await user.click(screen.getByRole("button", { name: /2024/ }));

    expect(malformed.scrollIntoView).not.toHaveBeenCalled();
    expect(vi.mocked(Element.prototype.scrollIntoView).mock.instances[0]).toBe(yearNodes()[3]);
    expect(yearNodes()[3]).toHaveAttribute("data-career-active", "true");
  });

  it("moves between years with arrow keys, Home, and End", async () => {
    const user = userEvent.setup();
    await hydrate();

    steps()[0]?.focus();
    await user.keyboard("{ArrowDown}");
    expect(steps()[1]).toHaveFocus();
    expect(steps()[1]).toHaveAttribute("aria-current", "true");

    await user.keyboard("{End}");
    expect(steps()[3]).toHaveFocus();
    expect(yearNodes()[3]).toHaveAttribute("data-career-active", "true");

    // Directional keys wrap, matching the shared roving helper.
    await user.keyboard("{ArrowDown}");
    expect(steps()[0]).toHaveFocus();

    await user.keyboard("{Home}");
    expect(steps()[0]).toHaveFocus();
    expect(yearNodes()[0]).toHaveAttribute("data-career-active", "true");
  });

  it("leaves keys it does not own to the browser", async () => {
    const user = userEvent.setup();
    await hydrate();
    steps()[0]?.focus();
    await user.keyboard("{PageDown}");
    expect(steps()[0]).toHaveAttribute("aria-current", "true");
    expect(yearNodes()[0]).toHaveAttribute("data-career-active", "true");
    expect(statusText()).toBe("");
  });

  it("opens on a year deep link without speaking over the page", async () => {
    window.history.replaceState(null, "", "#career-year-2024");
    await hydrate();
    expect(yearNodes()[2]).toHaveAttribute("data-career-active", "true");
    // The browser already scrolled there; announcing it would talk over the
    // page the reader just asked for.
    expect(statusText()).toBe("");
  });

  it("resolves an event deep link to the year that holds it", async () => {
    // `cert-a` lives in the 2025 group, which is the *second* rendered group,
    // while 2025 is also the second stepper entry — the anchor says neither.
    window.history.replaceState(null, "", "#career-cert-a");
    await hydrate();
    expect(yearNodes()[1]).toHaveAttribute("data-career-active", "true");
    expect(steps()[1]).toHaveAttribute("aria-current", "true");
    expect(statusText()).toBe("");
  });

  it("announces a later hash change, and ignores one it cannot resolve", async () => {
    await hydrate();
    expect(statusText()).toBe("");

    act(() => {
      window.location.hash = "#career-year-2025";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    await waitFor(() => expect(statusText()).toBe("2025: 3 records"));
    expect(yearNodes()[1]).toHaveAttribute("data-career-active", "true");

    act(() => {
      window.location.hash = "#career-does-not-exist";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(statusText()).toBe("2025: 3 records");
    expect(yearNodes()[1]).toHaveAttribute("data-career-active", "true");
  });

  it("applies a mount deep link once, so a resize cannot re-apply a stale hash", async () => {
    const ro = mockResizeObserver();
    window.history.replaceState(null, "", "#career-year-2024");
    await hydrate();
    expect(yearNodes()[2]).toHaveAttribute("data-career-active", "true");

    // The reader has since moved on: the click moved the marker to 2026 (and
    // the URL with it, via `replaceState`), so plant the arrival hash back
    // silently — the stale value a re-run must not re-apply.
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /2026/ }));
    window.history.replaceState(null, "", "#career-year-2024");

    // Late content arrives, so the re-measure produces a new `years` identity
    // and the hash-sync effect re-runs. The once-guard holds, and the reader's
    // 2026 survives; without it the stale #2024 yanks them back. A bare resize
    // cannot prove this — `sameYearGroups` keeps the identity stable, so the
    // effect would not re-run at all.
    const late = document.createElement("li");
    late.setAttribute("data-career-year", "2020");
    const events = document.createElement("ol");
    const event = document.createElement("li");
    event.setAttribute("data-career-id", "late-arrival");
    events.appendChild(event);
    late.appendChild(events);
    document.querySelector("[data-career-root]")?.appendChild(late);
    // Twice: the observer's first notification is the layout hydration just
    // measured and is skipped by design — only the second is a real resize.
    // A single notify here would assert nothing at all.
    act(() => ro.notify());
    act(() => ro.notify());
    expect(yearNodes()[0]).toHaveAttribute("data-career-active", "true");
    expect(yearNodes()[2]).not.toHaveAttribute("data-career-active");
    ro.restore();
  });
});

describe("CareerSpine scrub", () => {
  it("registers no scroll listener of its own — the scrub rides ScrollTrigger's (M1.3.3)", async () => {
    const track = trackAddedListeners();
    await hydrate();
    await waitFor(() => expect(ScrollTrigger.getAll().length).toBeGreaterThan(0));
    track.restore();
    const scrolls = track.added.filter((entry) => entry.type === "scroll");
    // React 19 wires one capture-phase listener per event type onto every root it
    // creates. That is React, not this island, and no island here can avoid it —
    // it is the per-root wiring Motion-II M-4.3 measured across all 17 islands.
    // What must be zero is what the island adds *on top*: the scroll-driven work
    // belongs to the one document listener ScrollTrigger already shares.
    expect(scrolls.every((entry) => entry.capture)).toBe(true);
    expect(
      scrolls.filter(
        (entry) =>
          !(
            entry.target instanceof Element && entry.target.hasAttribute(ISLAND_CONTAINER_ATTRIBUTE)
          ),
      ),
    ).toEqual([]);
    expect(scrolls.length).toBeGreaterThan(0);
    // Positive control: the tracker saw the island's own listener, so the empty
    // list above cannot be an instrument that silently stopped recording. Exactly
    // once — `window` is patched twice (prototype *and* its own property), and a
    // window call that recorded twice would inflate the counts these assertions
    // are built on.
    expect(
      track.added.filter((entry) => entry.type === "hashchange" && entry.target === window),
    ).toHaveLength(1);
  });

  it("draws the fill from the measured tops, so it tracks the year it marks", async () => {
    await hydrate();
    expect(ruleScaleY()).toBe(0);

    // viewport 768, reading line at 70% = 537.6. scrollY 700 puts it at 1237.6:
    // inside 2024's span (1200–1300), 37.6% of the way through it.
    setScrollPosition(700);
    act(() => {
      ScrollTrigger.update();
    });
    expect(yearNodes()[2]).toHaveAttribute("data-career-active", "true");
    expect(ruleScaleY()).toBeCloseTo((2 + 0.376) / 4, 3);

    setScrollPosition(1500);
    act(() => {
      ScrollTrigger.update();
    });
    expect(yearNodes()[3]).toHaveAttribute("data-career-active", "true");
    expect(ruleScaleY()).toBe(1);
  });

  it("reads layout once per pass: one hydration pass, one per real resize (M1.3.4)", async () => {
    const ro = mockResizeObserver();
    const view = await hydrate();
    const perPass = GROUPS.length;
    expect(yearGroupReads()).toBe(perPass);

    // The observer's first notification describes the layout hydration just
    // measured, so measuring again there is the read-after-write thrash Motion
    // Score reports as mount thrashing.
    act(() => ro.notify());
    expect(yearGroupReads()).toBe(perPass);

    // A genuine resize measures exactly once more.
    act(() => ro.notify());
    expect(yearGroupReads()).toBe(perPass * 2);

    view.unmount();
    act(() => ro.notify());
    expect(yearGroupReads()).toBe(perPass * 2);

    ro.restore();
  });

  it("kills only its own trigger on unmount (M1.3.6)", async () => {
    // A neighbour that owns a trigger (any trigger will do — what matters is
    // that unmounting this island leaves someone else's trigger alone).
    const neighbour = ScrollTrigger.create({
      trigger: document.body,
      start: "top 70%",
      end: "bottom 70%",
      onUpdate: () => {},
    });

    const view = await hydrate();
    await waitFor(() => expect(ScrollTrigger.getAll()).toContain(neighbour));
    const own = ScrollTrigger.getAll().find((trigger) => trigger !== neighbour);
    expect(own, "the island should have created a trigger").toBeDefined();

    view.unmount();

    // Its own trigger is gone (no leak)...
    expect(ScrollTrigger.getAll()).not.toContain(own);
    // ...and the neighbour's is untouched, still pointing at the same instance.
    expect(ScrollTrigger.getAll()).toContain(neighbour);

    neighbour.kill();
  });

  it("clears its mark when it unmounts", async () => {
    const view = await hydrate();
    expect(yearNodes()[0]).toHaveAttribute("data-career-active", "true");
    view.unmount();
    for (const node of yearNodes()) expect(node).not.toHaveAttribute("data-career-active");
  });
});

describe("CareerSpine without the scrub", () => {
  it("drops the rule and the trigger under reduced motion, keeping the stepper", async () => {
    reducedMotion = true;
    await hydrate();

    expect(document.querySelector("[data-career-rule]")).toBeNull();
    expect(ScrollTrigger.getAll()).toHaveLength(0);
    // Navigation is not motion: the stepper is how a reader moves between years
    // when there is no scrub, so removing it would remove navigation too.
    expect(steps()).toHaveLength(4);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /2025/ }));
    expect(yearNodes()[1]).toHaveAttribute("data-career-active", "true");
    expect(statusText()).toBe("2025: 3 records");
  });

  it("does the same under prefers-reduced-data", async () => {
    const restore = stubMedia("prefers-reduced-data", true);
    await hydrate();

    expect(document.querySelector("[data-career-rule]")).toBeNull();
    expect(ScrollTrigger.getAll()).toHaveLength(0);
    expect(steps()).toHaveLength(4);
    restore();
  });

  it("leaves the spine unmarked until the reader jumps, having nothing to derive from", async () => {
    reducedMotion = true;
    await hydrate();
    for (const node of yearNodes()) expect(node).not.toHaveAttribute("data-career-active");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /2024/ }));
    expect(yearNodes()[2]).toHaveAttribute("data-career-active", "true");
  });
});
