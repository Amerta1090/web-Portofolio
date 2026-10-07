import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TimeAwareHero from "./TimeAwareHero";

/**
 * M2.1 — the hero evidence row.
 *
 * The numbers themselves are proven by `lib/hero-metrics.test.ts` (what exists and
 * what does not); this file is about what the island does with the rows it is
 * handed:
 *
 * - **No row is not the same as an empty row.** An empty `<ul>`, or a link with
 *   nowhere to go, is a dead control (P5) — and the hero renders on every build,
 *   including the cache-less ones.
 * - **Every figure is checkable.** The link has to carry the href *and* the name
 *   that was built next to its value, so the two cannot drift.
 * - **Static is a real branch, not a comment.** `prefers-reduced-motion` and
 *   `prefers-reduced-data` take different code paths (one is a hook, one is a
 *   `matchMedia` read after mount), and the observable is the same either way: the
 *   row is readable immediately instead of waiting out the hero's entrance.
 */

let reducedMotion = false;

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return {
    ...actual,
    useReducedMotion: () => reducedMotion,
  };
});

/** Two of the four rows, enough to prove the row maps 1:1 and keeps its order. */
const METRICS = [
  {
    id: "contributions" as const,
    label: "Contributions",
    value: "571",
    suffix: "",
    href: "#github",
    name: "Contributions: 571",
  },
  {
    id: "longest-streak" as const,
    label: "Longest streak",
    value: "27",
    suffix: "days",
    href: "#github",
    name: "Longest streak: 27 days",
  },
];

const BASE_PROPS = {
  name: "Abdul Majid Ridwan Tyastonoatmaja",
  headline: "AI/ML Engineer & Systems Builder",
  tagline: "Turning messy data into working systems",
  resumeUrl: "/resume.pdf",
};

/**
 * The row's own list element, found through the hook the island writes.
 *
 * Deliberately *not* derived from a metric link (`[data-hero-metric]`'s
 * grandparent): that lookup returns `null` for a row that is rendered but empty,
 * so an empty `<ul>` — the exact thing this file forbids — is invisible to it. The
 * mutation that changed `metrics.length > 0` to `>= 0` proved it: every test stayed
 * green because none of them could see the row they were talking about.
 */
function row(): HTMLUListElement | null {
  return document.querySelector("[data-hero-metric-row]");
}

/**
 * Whether the row is a motion-managed element, read off the inline style motion
 * writes on mount (`opacity: 0; transform: translateY(8px)`). The plain branch
 * carries no inline style at all, which is the literal meaning of "text, not
 * animation" — a shape assertion, so it cannot drift with jsdom's cascade.
 */
function rowIsAnimated(): boolean {
  const style = row()?.getAttribute("style") ?? "";
  return style.includes("opacity");
}

/** `prefers-reduced-data` is read after mount, so it needs a media query stub. */
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

beforeEach(() => {
  reducedMotion = false;
});

describe("TimeAwareHero evidence row", () => {
  it("renders nothing at all when there are no metrics", () => {
    // The cache-less build is the normal case (`.cache/` is gitignored): the row
    // disappears rather than printing zeros, and no empty list is left behind.
    const { rerender } = render(<TimeAwareHero {...BASE_PROPS} />);
    expect(row()).toBeNull();
    expect(document.querySelectorAll("[data-hero-metric-row]")).toHaveLength(0);
    expect(document.querySelectorAll("[data-hero-metric]")).toHaveLength(0);

    rerender(<TimeAwareHero {...BASE_PROPS} metrics={[]} />);
    expect(row()).toBeNull();
    expect(document.querySelectorAll("[data-hero-metric-row]")).toHaveLength(0);
    expect(document.querySelectorAll("[data-hero-metric]")).toHaveLength(0);
  });

  it("makes every figure a link that carries its own accessible name", () => {
    render(<TimeAwareHero {...BASE_PROPS} metrics={METRICS} />);

    const links = screen.getAllByRole("link");
    // Two metrics in, two links out — the CTA pair plus nothing invented.
    const heroLinks = links.filter((a) => a.hasAttribute("data-hero-metric"));
    expect(heroLinks).toHaveLength(METRICS.length);

    for (const metric of METRICS) {
      const link = document.querySelector(`[data-hero-metric="${metric.id}"]`) as HTMLAnchorElement;
      expect(link).not.toBeNull();
      expect(link.tagName).toBe("A");
      expect(link.getAttribute("href")).toBe(metric.href);
      // Exact equality, not a word budget (Q4.2 #8): the name has to be the one the
      // builder paired with this value, and it has to contain the visible label.
      expect(link.getAttribute("aria-label")).toBe(metric.name);
      expect(link.textContent).toContain(metric.value);
      expect(link.textContent).toContain(metric.label);
    }
  });

  it("waits for the hero entrance by default, and the row arrives with it", async () => {
    render(<TimeAwareHero {...BASE_PROPS} metrics={METRICS} />);

    // Not `loaded` yet: the row is mounted but held back by the entrance, and it
    // says so — motion's animation loop does not run reliably outside a browser,
    // so the state hook is the observable and the inline style is corroboration.
    expect(rowIsAnimated()).toBe(true);
    expect(row()?.getAttribute("data-hero-metric-row")).toBe("pending");
    expect(row()?.style.opacity).toBe("0");

    await act(async () => {
      // `duration.narrative` is the entrance timer.
      await new Promise((resolve) => setTimeout(resolve, 1300));
    });
    expect(row()?.getAttribute("data-hero-metric-row")).toBe("ready");
  });

  it("is already readable under reduced motion", () => {
    reducedMotion = true;
    render(<TimeAwareHero {...BASE_PROPS} metrics={METRICS} />);

    // No timer, no entrance: the figures are on screen with the first paint.
    expect(rowIsAnimated()).toBe(false);
    expect(row()?.getAttribute("data-hero-metric-row")).toBe("ready");
    expect(document.querySelectorAll("[data-hero-metric]")).toHaveLength(2);
  });

  it("is already readable under prefers-reduced-data", () => {
    const restore = stubMedia("prefers-reduced-data", true);
    render(<TimeAwareHero {...BASE_PROPS} metrics={METRICS} />);

    // Same observable as reduced motion, reached through the other branch: the
    // `matchMedia` read happens in an effect, so this also proves the row is not
    // stuck half-animated once the preference resolves.
    expect(rowIsAnimated()).toBe(false);
    expect(row()?.getAttribute("data-hero-metric-row")).toBe("ready");
    expect(document.querySelectorAll("[data-hero-metric]")).toHaveLength(2);
    restore();
  });

  it("does not leave the reduced-data listener behind", () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const original = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: query.includes("prefers-reduced-data"),
        media: query,
        onchange: null,
        addEventListener,
        removeEventListener,
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    const { unmount } = render(<TimeAwareHero {...BASE_PROPS} metrics={METRICS} />);
    expect(addEventListener).toHaveBeenCalledTimes(1);
    unmount();
    expect(removeEventListener).toHaveBeenCalledTimes(1);

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: original,
    });
  });
});
