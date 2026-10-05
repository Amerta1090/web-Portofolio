import { render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ScrollTrigger, gsap } from "./gsap";
import { useGSAP } from "./useGSAP";

/**
 * Why these tests exist: `useGSAP`'s cleanup used to run
 * `ScrollTrigger.getAll().forEach((st) => st.kill())` after `ctx.revert()`.
 * That killed every ScrollTrigger on the page, not just this component's.
 *
 * Observables used throughout (from GSAP 3.15 source, not guessed):
 *  - `ScrollTrigger.getAll()` is the live registry (`_triggers`).
 *  - `ScrollTrigger.kill()` splices itself out of `_triggers` AND sets
 *    `animation.scrollTrigger = null` before killing the animation
 *    (ScrollTrigger.js `self.kill`). So `tween.scrollTrigger === trigger`
 *    is a reliable "this trigger is still wired up" certificate, and
 *    `tween.scrollTrigger === null` is the corresponding death certificate.
 *  - ScrollTrigger instances register themselves into the ambient
 *    `gsap.context()` via `_context(this)`, and `Context.revert()` walks
 *    that list — which is why `ctx.revert()` alone is already a scoped kill.
 *
 * Both halves are asserted on the same observable: unmounting an island must
 * NOT kill its neighbours' triggers, and MUST still kill its own. A "fix" that
 * simply stopped cleaning up would pass the first and fail the second.
 */

type Tween = gsap.core.Tween & { scrollTrigger?: ScrollTrigger | null };

/** A scrub ScrollTrigger created via `fromTo` — the shape the retired `JourneyTimeline` used. */
function ScrollTriggerOwner({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { scaleY: 0 },
      {
        scaleY: 1,
        scrollTrigger: { trigger: ref.current, start: "top 70%", end: "bottom 30%", scrub: 1.5 },
      },
    );
  });
  return <div ref={ref} data-owner={label} />;
}

/**
 * Mirrors `SignalLoom`, which is what made the bug observable: both of its
 * `useGSAP` calls build plain timelines and create ZERO ScrollTriggers, yet its
 * cleanup re-runs whenever `hydrated` / `edgeCoords` / `guard.paused` change.
 */
function TimelineOnlyIsland({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (!ref.current) return;
    gsap.timeline().fromTo(ref.current, { opacity: 0.3 }, { opacity: 1, duration: 0.4 });
  });
  return <div ref={ref} data-timeline-only={label} />;
}

/** A dep change re-runs cleanup without unmounting — SignalLoom's real pattern. */
function DepChangingIsland({ label, dep }: { label: string; dep: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (!ref.current) return;
    gsap.timeline().fromTo(ref.current, { x: 0 }, { x: dep, duration: 0.2 });
  }, [dep]);
  return <div ref={ref} data-dep={label} />;
}

function clearAll() {
  for (const st of ScrollTrigger.getAll()) st.kill();
  gsap.globalTimeline.clear();
}

beforeEach(clearAll);
afterEach(clearAll);

describe("useGSAP cleanup scope", () => {
  it("unmounting one island leaves another island's ScrollTriggers alive", () => {
    const survivor = render(<ScrollTriggerOwner label="survivor" />);
    const survivorTrigger = gsap
      .getTweensOf(survivor.container.querySelector("[data-owner]"))
      .map((t) => (t as Tween).scrollTrigger)
      .filter(Boolean)[0];

    expect(survivorTrigger, "survivor should have registered a ScrollTrigger").toBeTruthy();
    expect(ScrollTrigger.getAll()).toContain(survivorTrigger);

    const other = render(<ScrollTriggerOwner label="other" />);
    const countBefore = ScrollTrigger.getAll().length;
    expect(countBefore).toBeGreaterThanOrEqual(2);

    other.unmount();

    // The neighbour is still registered...
    expect(ScrollTrigger.getAll()).toContain(survivorTrigger);
    // ...and its animation is still wired to that trigger (not nulled by kill()).
    const survivorTween = gsap.getTweensOf(survivor.container.querySelector("[data-owner]"))[0];
    expect((survivorTween as Tween).scrollTrigger).toBe(survivorTrigger);

    survivor.unmount();
  });

  it("an island that creates no ScrollTrigger cannot kill the page's triggers", () => {
    const owner = render(<ScrollTriggerOwner label="owner" />);
    const ownerTrigger = gsap
      .getTweensOf(owner.container.querySelector("[data-owner]"))
      .map((t) => (t as Tween).scrollTrigger)
      .filter(Boolean)[0];

    expect(ScrollTrigger.getAll()).toContain(ownerTrigger);

    // SignalLoom's shape: zero ScrollTriggers of its own.
    const timelineOnly = render(<TimelineOnlyIsland label="timeline-only" />);
    timelineOnly.unmount();

    expect(ScrollTrigger.getAll()).toContain(ownerTrigger);
    const ownerTween = gsap.getTweensOf(owner.container.querySelector("[data-owner]"))[0];
    expect((ownerTween as Tween).scrollTrigger).toBe(ownerTrigger);

    owner.unmount();
  });

  it("a dep change re-running cleanup does not kill another island's triggers", () => {
    const owner = render(<ScrollTriggerOwner label="owner" />);
    const ownerTrigger = gsap
      .getTweensOf(owner.container.querySelector("[data-owner]"))
      .map((t) => (t as Tween).scrollTrigger)
      .filter(Boolean)[0];

    const churner = render(<DepChangingIsland label="churner" dep={1} />);
    churner.rerender(<DepChangingIsland label="churner" dep={2} />);
    churner.rerender(<DepChangingIsland label="churner" dep={3} />);

    expect(ScrollTrigger.getAll()).toContain(ownerTrigger);

    churner.unmount();
    expect(ScrollTrigger.getAll()).toContain(ownerTrigger);
    owner.unmount();
  });

  it("still kills its own ScrollTriggers on unmount (no leak)", () => {
    const view = render(<ScrollTriggerOwner label="owner" />);
    const el = view.container.querySelector("[data-owner]");
    const tween = gsap.getTweensOf(el)[0] as Tween;
    const own = tween.scrollTrigger;

    expect(own).toBeTruthy();
    expect(ScrollTrigger.getAll()).toContain(own);

    view.unmount();

    expect(ScrollTrigger.getAll()).not.toContain(own);
    expect(tween.scrollTrigger).toBeNull();
    expect(gsap.getTweensOf(el)).toHaveLength(0);
  });

  it("still reverts its own non-ScrollTrigger animations on unmount", () => {
    const view = render(<TimelineOnlyIsland label="timeline-only" />);
    const el = view.container.querySelector("[data-timeline-only]");
    expect(gsap.getTweensOf(el).length).toBeGreaterThan(0);

    view.unmount();

    expect(gsap.getTweensOf(el)).toHaveLength(0);
  });
});

/**
 * NOTE (M1.5): the "real consumer" describe that stood here is deleted, not
 * retargeted. It rendered `JourneyTimeline` because that island owned two
 * scrub triggers; the only remaining real trigger owner, `ImpactMetrics`,
 * cannot fill the role — its trigger is `once: true`, and under jsdom's zero
 * geometry it fires on creation and removes itself, so there is nothing whose
 * survival can be asserted (measured: `getAll()` stays 0 after render). The
 * mirror-based describes above assert the identical properties
 * (neighbour survival through `ScrollTriggerOwner`), so no coverage is lost.
 */
