import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SignalLoomGraph } from "../lib/creative/signal-loom";
import SignalLoom from "./SignalLoom";

/**
 * M5.2 — the entry fade draws the default reading path first.
 *
 * The ordering is the only part of M5.1/M5.2 that is not already covered by
 * `signal-loom.test.ts`: the narrative says "the strongest ties come first", and
 * the animation has to earn that sentence. `SignalLoom.test.tsx` stubs
 * `useGSAP` out entirely (it asserts the DOM contract), so the tween target
 * list is only observable from a file that lets the effect run. This file stubs
 * the *tween engine* instead and keeps the real effect, recording which ids the
 * first `fromTo` receives.
 */
const { recorded } = vi.hoisted(() => ({ recorded: [] as string[][] }));

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return { ...actual, useReducedMotion: () => false };
});

vi.mock("../lib/useGSAP", async () => {
  const { useEffect } = await import("react");
  return {
    // Runs the callback like the real hook does (after hydration, on deps
    // change); the cleanup half is irrelevant here because the engine is fake.
    useGSAP: (callback: () => void, deps: unknown[] = []) => {
      useEffect(() => {
        callback();
      }, deps);
    },
  };
});

vi.mock("../lib/gsap", () => ({
  gsap: {
    registerPlugin: () => {},
    defaults: () => {},
    timeline: () => {
      const tl = {
        fromTo: (targets: unknown) => {
          const list = Array.isArray(targets) ? (targets as SVGLineElement[]) : [];
          recorded.push(
            list
              .map((element) => element.getAttribute("data-edge"))
              .filter((id): id is string => !!id),
          );
          return tl;
        },
        to: () => tl,
        play: () => {},
        pause: () => {},
      };
      return tl;
    },
    fromTo: () => {},
    to: () => {},
    set: () => {},
  },
  ScrollTrigger: class ScrollTrigger {},
}));

/**
 * `capability-ml` is the default node and owns three edges with weights 2, 2, 1.
 * The weight order and the node order deliberately disagree: `project-a` is the
 * first project in the graph but has the weakest tie, so a plain DOM-order fade
 * (or an edge-order fade) would draw `a` first and fail.
 */
const GRAPH: SignalLoomGraph = {
  nodes: [
    { id: "capability-ml", label: "Machine Learning", kind: "capability", summary: "ML summary" },
    { id: "capability-web", label: "Web Systems", kind: "capability", summary: "Web summary" },
    { id: "project-a", label: "Project A", kind: "project", summary: "A summary" },
    { id: "project-b", label: "Project B", kind: "project", summary: "B summary" },
    { id: "project-c", label: "Project C", kind: "project", summary: "C summary" },
  ],
  edges: [
    { id: "ml->a", from: "capability-ml", to: "project-a", label: "one", weight: 1 },
    { id: "ml->b", from: "capability-ml", to: "project-b", label: "two", weight: 2 },
    { id: "ml->c", from: "capability-ml", to: "project-c", label: "two", weight: 2 },
    { id: "web->a", from: "capability-web", to: "project-a", label: "one", weight: 1 },
  ],
  defaultNodeId: "capability-ml",
};

afterEach(() => {
  recorded.length = 0;
});

describe("SignalLoom entry ordering (M5.2)", () => {
  it("fades the default path's heaviest edges in before anything else", async () => {
    const { container } = render(<SignalLoom graph={GRAPH} />);

    // Edges only exist once the layout pass has run, and the entry tween only
    // starts after that — so wait on the recording, not on the markup.
    await waitFor(() => expect(recorded.length).toBeGreaterThan(0));
    await waitFor(() =>
      expect(container.querySelectorAll("[data-edge]")).toHaveLength(GRAPH.edges.length),
    );

    // The entry fade is the call that receives every connector, the signal-dot
    // tweens receive one node each.
    const entry = recorded.find((ids) => ids.length === GRAPH.edges.length);
    expect(entry).toBeDefined();
    if (!entry) throw new Error("entry tween missing");

    expect(entry).toEqual(["ml->b", "ml->c", "ml->a", "web->a"]);
    // Weight wins over graph order: `project-a` is listed first in the data.
    expect(entry[0]).toBe("ml->b");
    expect(entry.at(-1)).toBe("web->a");
    // Stable sort keeps every edge: ordering must not drop the tail.
    expect(new Set(entry).size).toBe(GRAPH.edges.length);
  });

  it("keeps the entry tween out of the way when the capability owns no edge", async () => {
    const isolated: SignalLoomGraph = {
      nodes: [
        { id: "capability-none", label: "Unused", kind: "capability", summary: "Unused summary" },
        { id: "capability-web", label: "Web Systems", kind: "capability", summary: "Web summary" },
        { id: "project-a", label: "Project A", kind: "project", summary: "A summary" },
      ],
      edges: [{ id: "web->a", from: "capability-web", to: "project-a", label: "one", weight: 1 }],
      defaultNodeId: "capability-none",
    };
    render(<SignalLoom graph={isolated} />);

    await waitFor(() => expect(recorded.length).toBeGreaterThan(0));
    // No default path exists, so every edge keeps its graph position and the
    // narrative is the thing that must be absent — not a fabricated order.
    const entry = recorded.find((ids) => ids.length === isolated.edges.length);
    expect(entry).toEqual(["web->a"]);
  });
});
