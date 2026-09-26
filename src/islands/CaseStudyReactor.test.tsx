import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProcessStage } from "../content/schema";
import { buildStageViews } from "../lib/creative/case-study-reactor";
import CaseStudyReactor from "./CaseStudyReactor";

let reducedMotion = false;

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return {
    ...actual,
    useReducedMotion: () => reducedMotion,
  };
});

function stage(overrides: Partial<ProcessStage> & { id: string }): ProcessStage {
  return {
    label: overrides.id,
    summary: `summary for ${overrides.id}`,
    evidence: `evidence for ${overrides.id}`,
    ...overrides,
  };
}

const STAGES = buildStageViews([
  stage({
    id: "problem",
    label: "Problem",
    summary: "Ten volumes with no way to search them.",
    diagram: {
      type: "flow",
      nodes: [
        { id: "question", label: "Scholarly question" },
        { id: "unverified", label: "Unverified answer", note: "fabricated citation" },
      ],
      edges: [["question", "unverified"]],
    },
  }),
  stage({
    id: "data",
    label: "Data",
    summary: "One corpus, two indexes.",
    metric: { label: "Corpus indexed", value: "6,500+ pages" },
    diagram: {
      type: "flow",
      caption: "Ingestion to two parallel indexes.",
      nodes: [
        { id: "pdf", label: "PDF volumes" },
        { id: "extract", label: "Text extraction" },
        { id: "chunk", label: "Chunking" },
        { id: "dense", label: "FAISS index", note: "dense" },
        { id: "sparse", label: "BM25 index", note: "sparse" },
      ],
      edges: [
        ["pdf", "extract"],
        ["extract", "chunk"],
        ["chunk", "dense"],
        ["chunk", "sparse"],
      ],
    },
  }),
  stage({
    id: "impact",
    label: "Impact",
    summary: "Answers that trace back to a page.",
  }),
]);

function stepper() {
  return screen.getByRole("list", { name: "Process stages" });
}

/** The island exposes data-* hooks (repo convention) instead of test ids. */
function hook<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`missing element: ${selector}`);
  return element;
}

describe("CaseStudyReactor", () => {
  beforeEach(() => {
    reducedMotion = false;
    window.location.hash = "";
    window.history.replaceState(null, "", window.location.pathname);
    document.body.innerHTML = "";
  });

  it("server-renders the first stage panel without any dead controls", () => {
    // No effects run on the server, so this is the real pre-hydration HTML.
    const html = renderToStaticMarkup(<CaseStudyReactor stages={STAGES} />);
    // Panel content ships with no JavaScript...
    expect(html).toContain("data-reactor-stage-label");
    expect(html).toContain("Problem");
    expect(html).toContain("data-reactor-diagram");
    // ...but the stepper only appears once it can actually change something.
    expect(html).not.toContain("data-reactor-stepper");
    expect(html).not.toContain("data-reactor-step=");
  });

  it("reveals stage controls after hydration", async () => {
    render(<CaseStudyReactor stages={STAGES} />);
    await waitFor(() => expect(stepper()).toBeInTheDocument());
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("marks the active stage and moves the panel on click", async () => {
    const user = userEvent.setup();
    render(<CaseStudyReactor stages={STAGES} />);
    await waitFor(() => expect(stepper()).toBeInTheDocument());

    expect(screen.getByRole("button", { name: /Problem/ })).toHaveAttribute("aria-current", "step");

    await user.click(screen.getByRole("button", { name: /Data/ }));

    expect(screen.getByRole("button", { name: /Data/ })).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("button", { name: /Problem/ })).not.toHaveAttribute("aria-current");
    expect(hook<HTMLElement>("[data-reactor-stage-label]")).toHaveTextContent("Data");
    expect(hook<HTMLElement>("[data-reactor-status]")).toHaveTextContent("Stage 2 of 3: Data");
    expect(window.location.hash).toBe("#stage-data");
  });

  it("renders the active stage diagram, caption, and metric", async () => {
    const user = userEvent.setup();
    render(<CaseStudyReactor stages={STAGES} />);
    await waitFor(() => expect(stepper()).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Data/ }));

    expect(hook<HTMLElement>("[data-reactor-caption]")).toHaveTextContent(
      "Ingestion to two parallel indexes.",
    );
    expect(hook<HTMLElement>("[data-reactor-metric]")).toHaveTextContent("6,500+ pages");

    const diagram = document.querySelector("[data-reactor-diagram]");
    expect(diagram).not.toBeNull();
    expect(diagram?.querySelectorAll("[data-reactor-node]")).toHaveLength(5);
    expect(diagram?.querySelectorAll("[data-reactor-edge]")).toHaveLength(4);
    // The fork is drawn, not flattened: two nodes share the last layer.
    const dense = diagram?.querySelector('[data-reactor-node="dense"] rect');
    const sparse = diagram?.querySelector('[data-reactor-node="sparse"] rect');
    expect(dense?.getAttribute("y")).toBe(sparse?.getAttribute("y"));
  });

  it("degrades to text when a stage has no diagram", async () => {
    const user = userEvent.setup();
    render(<CaseStudyReactor stages={STAGES} />);
    await waitFor(() => expect(stepper()).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Impact/ }));
    expect(document.querySelector("[data-reactor-diagram]")).toBeNull();
    expect(screen.getByText(/no flow diagram/i)).toBeInTheDocument();
  });

  it("moves between stages with arrow keys, Home, and End", async () => {
    const user = userEvent.setup();
    render(<CaseStudyReactor stages={STAGES} />);
    await waitFor(() => expect(stepper()).toBeInTheDocument());

    const first = screen.getByRole("button", { name: /Problem/ });
    first.focus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: /Data/ })).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("button", { name: /Data/ })).toHaveFocus();

    await user.keyboard("{End}");
    expect(hook<HTMLElement>("[data-reactor-stage-label]")).toHaveTextContent("Impact");

    await user.keyboard("{ArrowRight}");
    expect(hook<HTMLElement>("[data-reactor-stage-label]")).toHaveTextContent("Problem");

    await user.keyboard("{Home}");
    expect(hook<HTMLElement>("[data-reactor-stage-label]")).toHaveTextContent("Problem");
  });

  it("keeps a single tab stop through roving tabindex", async () => {
    const user = userEvent.setup();
    render(<CaseStudyReactor stages={STAGES} />);
    await waitFor(() => expect(stepper()).toBeInTheDocument());

    const buttons = screen.getAllByRole("button");
    expect(buttons.filter((button) => button.getAttribute("tabindex") === "0")).toHaveLength(1);
    buttons[0]?.focus();
    await user.keyboard("{ArrowDown}");
    const active = screen.getAllByRole("button").filter((b) => b.getAttribute("tabindex") === "0");
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveTextContent("Data");
  });

  it("follows a stage anchor clicked inside the static list", async () => {
    const user = userEvent.setup();
    // The site router turns same-page anchor clicks into pushState, so the
    // island resolves the click itself instead of waiting for `hashchange`.
    const listItem = document.createElement("li");
    listItem.id = "stage-impact";
    const anchor = document.createElement("a");
    anchor.setAttribute("href", "#stage-impact");
    listItem.append(anchor);
    document.body.append(listItem);

    render(<CaseStudyReactor stages={STAGES} />);
    await waitFor(() => expect(stepper()).toBeInTheDocument());

    await user.click(anchor);
    await waitFor(() =>
      expect(hook<HTMLElement>("[data-reactor-stage-label]")).toHaveTextContent("Impact"),
    );
    listItem.remove();
  });

  it("opens on a stage deep link and follows later hash changes", async () => {
    window.history.replaceState(null, "", "#stage-impact");
    render(<CaseStudyReactor stages={STAGES} />);
    await waitFor(() => expect(stepper()).toBeInTheDocument());
    expect(hook<HTMLElement>("[data-reactor-stage-label]")).toHaveTextContent("Impact");

    // Clicking a stage anchor inside the static list drives the same state.
    window.location.hash = "#stage-data";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    await waitFor(() =>
      expect(hook<HTMLElement>("[data-reactor-stage-label]")).toHaveTextContent("Data"),
    );

    // An unknown anchor never clears the stage.
    window.location.hash = "#stage-nope";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    await waitFor(() =>
      expect(hook<HTMLElement>("[data-reactor-stage-label]")).toHaveTextContent("Data"),
    );
  });

  it("marks the matching list item and cleans up on unmount", async () => {
    const user = userEvent.setup();
    const listItem = document.createElement("li");
    listItem.id = "stage-data";
    document.body.append(listItem);

    const { unmount } = render(<CaseStudyReactor stages={STAGES} />);
    await waitFor(() => expect(stepper()).toBeInTheDocument());
    expect(listItem).not.toHaveAttribute("data-reactor-active");

    await user.click(screen.getByRole("button", { name: /Data/ }));
    expect(listItem).toHaveAttribute("data-reactor-active", "true");

    await user.click(screen.getByRole("button", { name: /Problem/ }));
    expect(listItem).not.toHaveAttribute("data-reactor-active");

    await user.click(screen.getByRole("button", { name: /Data/ }));
    unmount();
    expect(listItem).not.toHaveAttribute("data-reactor-active");
    listItem.remove();
  });

  it("omits the animation hook when the visitor prefers reduced motion", async () => {
    reducedMotion = true;
    render(<CaseStudyReactor stages={STAGES} />);
    await waitFor(() => expect(stepper()).toBeInTheDocument());

    const root = document.querySelector("[data-reactor]");
    expect(root).not.toBeNull();
    // The controls and the resting diagram are identical; only the entry
    // animation hook is withheld.
    expect(root).not.toHaveAttribute("data-reactor-animate");
    expect(hook<HTMLElement>("[data-reactor-stage-label]")).toHaveTextContent("Problem");
  });

  it("adds the animation hook when motion is allowed", async () => {
    render(<CaseStudyReactor stages={STAGES} />);
    await waitFor(() => expect(stepper()).toBeInTheDocument());
    expect(document.querySelector("[data-reactor]")).toHaveAttribute(
      "data-reactor-animate",
      "true",
    );
  });

  it("renders nothing when a case study has no stages", () => {
    const { container } = render(<CaseStudyReactor stages={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
