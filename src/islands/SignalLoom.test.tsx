import { fireEvent, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SignalLoomGraph } from "../lib/creative/signal-loom";
import SignalLoom from "./SignalLoom";

let reducedMotion = false;

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return {
    ...actual,
    useReducedMotion: () => reducedMotion,
  };
});

// GSAP choreography is a visual enhancement: in jsdom we assert the DOM
// contract (dots rendered/capped/remounted, immediate reduced state), not tween
// frames. Registering ScrollTrigger needs window.matchMedia, which jsdom lacks,
// so both modules are stubbed here instead of changing shared test infra.
vi.mock("../lib/useGSAP", () => ({
  useGSAP: () => {},
}));

vi.mock("../lib/gsap", () => ({
  gsap: {
    registerPlugin: () => {},
    defaults: () => {},
    timeline: () => {
      const tl = { fromTo: () => tl, to: () => tl, play: () => {}, pause: () => {} };
      return tl;
    },
    fromTo: () => {},
    to: () => {},
    set: () => {},
  },
  ScrollTrigger: class ScrollTrigger {},
}));

const GRAPH: SignalLoomGraph = {
  nodes: [
    {
      id: "capability-ml",
      label: "Machine Learning",
      kind: "capability",
      summary: "ML capability summary",
    },
    {
      id: "capability-web",
      label: "Web Systems",
      kind: "capability",
      summary: "Web capability summary",
    },
    { id: "project-a", label: "Project A", kind: "project", summary: "Project A summary" },
  ],
  edges: [
    { id: "capability-ml->project-a", from: "capability-ml", to: "project-a", label: "ml" },
    { id: "capability-web->project-a", from: "capability-web", to: "project-a", label: "web" },
  ],
  defaultNodeId: "project-a",
};

const WIDE_GRAPH: SignalLoomGraph = {
  nodes: [
    { id: "capability-a", label: "Cap A", kind: "capability", summary: "Cap A summary" },
    { id: "capability-b", label: "Cap B", kind: "capability", summary: "Cap B summary" },
    { id: "capability-c", label: "Cap C", kind: "capability", summary: "Cap C summary" },
    { id: "capability-d", label: "Cap D", kind: "capability", summary: "Cap D summary" },
    { id: "capability-e", label: "Cap E", kind: "capability", summary: "Cap E summary" },
    { id: "project-z", label: "Project Z", kind: "project", summary: "Project Z summary" },
  ],
  edges: [
    { id: "e1", from: "capability-a", to: "project-z", label: "one" },
    { id: "e2", from: "capability-b", to: "project-z", label: "two" },
    { id: "e3", from: "capability-c", to: "project-z", label: "three" },
    { id: "e4", from: "capability-d", to: "project-z", label: "four" },
    { id: "e5", from: "capability-e", to: "project-z", label: "five" },
  ],
  defaultNodeId: "project-z",
};

function statusText(container: HTMLElement): string {
  return container.querySelector("[data-signal-status-text]")?.textContent ?? "";
}

function dotIds(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("[data-signal-dot]"))
    .map((dot) => dot.getAttribute("data-signal-dot"))
    .filter((id): id is string => id !== null);
}

function mockReducedData(matches: boolean): () => void {
  const original = window.matchMedia;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query.includes("prefers-reduced-data") ? matches : false,
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

afterEach(() => {
  window.location.hash = "";
  reducedMotion = false;
});

describe("SignalLoom selection states (L2.1)", () => {
  it("renders the default node selected with status and roving tabindex", () => {
    const { container } = render(<SignalLoom graph={GRAPH} />);

    const project = container.querySelector('[data-signal-node="project-a"]');
    const ml = container.querySelector('[data-signal-node="capability-ml"]');

    expect(project).toHaveAttribute("aria-current", "true");
    expect(project).toHaveAttribute("aria-pressed", "true");
    expect(project).toHaveAttribute("tabindex", "0");
    expect(ml).not.toHaveAttribute("aria-current");
    expect(ml).toHaveAttribute("tabindex", "-1");
    expect(statusText(container)).toBe("Project A summary");
  });

  it("selects a node on pointer click and updates status, hash, and emphasis", async () => {
    const user = userEvent.setup();
    const { container } = render(<SignalLoom graph={GRAPH} />);

    const web = container.querySelector<HTMLButtonElement>('[data-signal-node="capability-web"]');
    const project = container.querySelector('[data-signal-node="project-a"]');
    if (!web) throw new Error("web node button missing");

    await user.click(web);

    await waitFor(() => expect(statusText(container)).toBe("Web capability summary"));
    expect(web).toHaveAttribute("aria-current", "true");
    expect(project).not.toHaveAttribute("aria-current");
    expect(window.location.hash).toBe("#signal-capability-web");

    const activeEdge = container.querySelector('[data-edge="capability-web->project-a"]');
    expect(activeEdge).toHaveAttribute("stroke", "rgb(var(--color-brand-rgb) / 0.95)");
  });

  it("moves selection with arrow keys and wraps around the node order", async () => {
    const user = userEvent.setup();
    const { container } = render(<SignalLoom graph={GRAPH} />);

    const project = container.querySelector<HTMLButtonElement>('[data-signal-node="project-a"]');
    project?.focus();
    expect(project).toHaveFocus();

    await user.keyboard("[ArrowRight]");
    const ml = container.querySelector<HTMLButtonElement>('[data-signal-node="capability-ml"]');
    expect(ml).toHaveFocus();
    expect(ml).toHaveAttribute("aria-current", "true");
    expect(statusText(container)).toBe("ML capability summary");

    await user.keyboard("[ArrowRight]");
    const web = container.querySelector<HTMLButtonElement>('[data-signal-node="capability-web"]');
    expect(web).toHaveFocus();
    expect(web).toHaveAttribute("aria-current", "true");

    await user.keyboard("[ArrowLeft]");
    expect(ml).toHaveFocus();
    expect(ml).toHaveAttribute("aria-current", "true");
  });

  it("jumps to first and last nodes with Home and End", async () => {
    const user = userEvent.setup();
    const { container } = render(<SignalLoom graph={GRAPH} />);

    const project = container.querySelector<HTMLButtonElement>('[data-signal-node="project-a"]');
    project?.focus();
    await user.keyboard("[Home]");
    const ml = container.querySelector<HTMLButtonElement>('[data-signal-node="capability-ml"]');
    expect(ml).toHaveFocus();
    expect(ml).toHaveAttribute("aria-current", "true");

    await user.keyboard("[End]");
    expect(project).toHaveFocus();
    expect(project).toHaveAttribute("aria-current", "true");
  });

  it("selects a valid deep-linked node on mount", async () => {
    window.location.hash = "#signal-capability-ml";
    const { container } = render(<SignalLoom graph={GRAPH} />);

    const ml = container.querySelector('[data-signal-node="capability-ml"]');
    await waitFor(() => expect(ml).toHaveAttribute("aria-current", "true"));
    expect(statusText(container)).toBe("ML capability summary");
  });

  it("falls back to the default node for an invalid deep link", () => {
    window.location.hash = "#signal-does-not-exist";
    const { container } = render(<SignalLoom graph={GRAPH} />);

    const project = container.querySelector('[data-signal-node="project-a"]');
    expect(project).toHaveAttribute("aria-current", "true");
    expect(statusText(container)).toBe("Project A summary");
  });

  it("renders a stable fallback status for an empty graph", () => {
    const { container } = render(
      <SignalLoom graph={{ nodes: [], edges: [], defaultNodeId: "" }} />,
    );

    expect(container.querySelectorAll("[data-signal-node]")).toHaveLength(0);
    expect(statusText(container)).toBe("Select a capability or project.");
  });

  it("highlights a hovered node's incident edges without selecting it", async () => {
    const user = userEvent.setup();
    const { container } = render(<SignalLoom graph={GRAPH} />);

    const web = container.querySelector<HTMLButtonElement>('[data-signal-node="capability-web"]');
    const ml = container.querySelector<HTMLButtonElement>('[data-signal-node="capability-ml"]');
    if (!web || !ml) throw new Error("nodes missing");
    await user.click(web); // active edge is now capability-web->project-a only

    const mlEdge = container.querySelector('[data-edge="capability-ml->project-a"]');
    expect(mlEdge).toHaveAttribute("stroke", "rgb(var(--color-border-rgb) / 0.8)");

    fireEvent.pointerEnter(ml);
    expect(mlEdge).toHaveAttribute("stroke", "rgb(var(--color-brand-rgb) / 0.95)");
    expect(ml).not.toHaveAttribute("aria-current");
    expect(statusText(container)).toBe("Web capability summary");

    fireEvent.pointerLeave(ml);
    expect(mlEdge).toHaveAttribute("stroke", "rgb(var(--color-border-rgb) / 0.8)");
  });

  it("clears hover emphasis when a focused node loses focus", async () => {
    const user = userEvent.setup();
    const { container } = render(<SignalLoom graph={GRAPH} />);

    // Select capability-web first so capability-ml's edge is muted at rest.
    const web = container.querySelector<HTMLButtonElement>('[data-signal-node="capability-web"]');
    if (!web) throw new Error("web node button missing");
    await user.click(web);

    const ml = container.querySelector('[data-signal-node="capability-ml"]');
    const mlEdge = container.querySelector('[data-edge="capability-ml->project-a"]');
    if (!ml || !mlEdge) throw new Error("ml node or edge missing");
    expect(mlEdge).toHaveAttribute("stroke", "rgb(var(--color-border-rgb) / 0.8)");

    fireEvent.focus(ml);
    expect(mlEdge).toHaveAttribute("stroke", "rgb(var(--color-brand-rgb) / 0.95)");

    fireEvent.blur(ml);
    expect(mlEdge).toHaveAttribute("stroke", "rgb(var(--color-border-rgb) / 0.8)");
  });

  it("lays capability and project cards out as the two graph zones", () => {
    const { container } = render(<SignalLoom graph={GRAPH} />);

    const capabilityZone = container.querySelector(
      'section[aria-label="Capability nodes"] ul[aria-label="Capabilities"]',
    );
    const projectZone = container.querySelector(
      'section[aria-label="Project evidence nodes"] ul[aria-label="Projects"]',
    );
    expect(capabilityZone?.querySelectorAll("[data-signal-node]")).toHaveLength(2);
    expect(projectZone?.querySelectorAll("[data-signal-node]")).toHaveLength(1);
  });

  it("marks the selected card and its connected cards for the card-to-card trace", async () => {
    const user = userEvent.setup();
    const { container } = render(<SignalLoom graph={GRAPH} />);

    const web = container.querySelector<HTMLButtonElement>('[data-signal-node="capability-web"]');
    const project = container.querySelector('[data-signal-node="project-a"]');
    const ml = container.querySelector('[data-signal-node="capability-ml"]');
    if (!web || !project || !ml) throw new Error("nodes missing");

    await user.click(web);

    // Selected card and its connected card both carry the trace marker.
    expect(web).toHaveAttribute("data-connected", "true");
    expect(project).toHaveAttribute("data-connected", "true");
    expect(ml).not.toHaveAttribute("data-connected");
  });
});

describe("SignalLoom bounded SVG choreography (L2.2)", () => {
  it("renders travelling dots for the capped active edges once hydrated", async () => {
    const { container } = render(<SignalLoom graph={GRAPH} />);

    await waitFor(() => expect(dotIds(container)).toHaveLength(2));
    expect(dotIds(container)).toEqual(["capability-ml->project-a", "capability-web->project-a"]);

    // Dots ride the measured card-to-card edges. jsdom has no layout, so the
    // coordinates are zeros here — assert the DOM contract (presence, ids,
    // fill), not pixel positions (real geometry is covered by E2E).
    const dot = container.querySelector('[data-signal-dot="capability-ml->project-a"]');
    expect(dot).toHaveAttribute("fill", "rgb(var(--color-brand-rgb) / 0.9)");
  });

  it("draws connector edges with measured coordinates once the layout is read", async () => {
    const { container } = render(<SignalLoom graph={GRAPH} />);

    await waitFor(() => {
      expect(container.querySelector('[data-edge="capability-ml->project-a"]')).not.toBeNull();
    });
    const edge = container.querySelector('[data-edge="capability-ml->project-a"]');
    expect(edge).toHaveAttribute("x1");
    expect(edge).toHaveAttribute("y1");
    expect(edge).toHaveAttribute("x2");
    expect(edge).toHaveAttribute("y2");
  });

  it("caps simultaneous animated paths at SIGNAL_MAX_DOTS", async () => {
    const { container } = render(<SignalLoom graph={WIDE_GRAPH} />);

    await waitFor(() => expect(dotIds(container)).toHaveLength(3));
    expect(dotIds(container)).toEqual(["e1", "e2", "e3"]);
  });

  it("shows reduced motion an immediate stable state without dots", async () => {
    reducedMotion = true;
    const { container } = render(<SignalLoom graph={GRAPH} />);

    await waitFor(() =>
      expect(container.querySelector('[data-signal-node="project-a"]')).toBeTruthy(),
    );
    expect(container.querySelectorAll("[data-signal-dot]")).toHaveLength(0);

    // Active edges are immediately emphasized (brand stroke), no draw trail.
    const activeEdge = container.querySelector('[data-edge="capability-ml->project-a"]');
    expect(activeEdge).toHaveAttribute("stroke", "rgb(var(--color-brand-rgb) / 0.95)");
  });

  it("keeps selection replacement deterministic under reduced motion", async () => {
    reducedMotion = true;
    const user = userEvent.setup();
    const { container } = render(<SignalLoom graph={GRAPH} />);

    const ml = container.querySelector<HTMLButtonElement>('[data-signal-node="capability-ml"]');
    if (!ml) throw new Error("ml node button missing");
    await user.click(ml);

    await waitFor(() => expect(statusText(container)).toBe("ML capability summary"));
    expect(container.querySelectorAll("[data-signal-dot]")).toHaveLength(0);
  });

  it("replaces old travel dots when the selection changes", async () => {
    const user = userEvent.setup();
    const { container } = render(<SignalLoom graph={GRAPH} />);

    await waitFor(() => expect(dotIds(container)).toHaveLength(2));

    const ml = container.querySelector<HTMLButtonElement>('[data-signal-node="capability-ml"]');
    if (!ml) throw new Error("ml node button missing");
    await user.click(ml);

    await waitFor(() => {
      expect(dotIds(container)).toEqual(["capability-ml->project-a"]);
    });
    expect(
      container.querySelectorAll('[data-signal-dot="capability-web->project-a"]'),
    ).toHaveLength(0);
  });

  it("renders no travelling dots in low-power mode but keeps emphasis", async () => {
    const restore = mockReducedData(true);
    const { container } = render(<SignalLoom graph={GRAPH} />);

    await waitFor(() =>
      expect(container.querySelector('[data-signal-node="project-a"]')).toBeTruthy(),
    );
    expect(container.querySelectorAll("[data-signal-dot]")).toHaveLength(0);

    const activeEdge = container.querySelector('[data-edge="capability-ml->project-a"]');
    expect(activeEdge).toHaveAttribute("stroke", "rgb(var(--color-brand-rgb) / 0.95)");
    restore();
  });
});
