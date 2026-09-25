import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import type { SignalLoomGraph } from "../lib/creative/signal-loom";
import SignalLoom from "./SignalLoom";

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

function statusText(container: HTMLElement): string {
  return container.querySelector("[data-signal-status-text]")?.textContent ?? "";
}

afterEach(() => {
  window.location.hash = "";
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
});
