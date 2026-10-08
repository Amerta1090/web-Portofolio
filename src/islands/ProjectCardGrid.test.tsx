import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import type { Project } from "../types/projects";
import ProjectCardGrid from "./ProjectCardGrid";

/**
 * The project card is an evidence surface: each visible line must trace back to
 * a field in `data/projects.json`, a field with no data must render an honest
 * fallback (never a broken/empty control), and the pre-hydration HTML must be
 * fully usable on its own (real anchors, no dead controls).
 */
const FULL: Project = {
  title: "IJO PLIS — IHSG & USD/IDR Forecasting Platform",
  period: "May 2026 – Jun 2026",
  description: "Forecasting platform built on Prophet.",
  links: [
    { label: "Project Demo Url", url: "https://example.com/demo" },
    { label: "GitHub Repository", url: "https://github.com/example/repo" },
  ],
  skills: ["Python", "Prophet", "Django", "Docker", "Celery"],
  media: ["IHSG Predictor", "IDR Predictor"],
  association: "Universitas AMIKOM Yogyakarta",
  featured: true,
  category: "ml",
  image: "/images/projects/ijo-plis.png",
};

const MINIMAL: Project = {
  title: "Bare Project",
  period: "",
  description: "Has neither skills nor links.",
  links: [],
  skills: [],
};

/** The homepage grid is 2 ml + 2 web — these fixtures mirror that shape. */
const ML_SECOND: Project = {
  title: "Sentiment Model Retrainer",
  period: "2025",
  description: "Second ml card so the filter has more than one survivor.",
  links: [],
  skills: [],
  category: "ml",
};

const WEB_FIRST: Project = {
  title: "Nyatet Notes",
  period: "2025",
  description: "First web card.",
  links: [],
  skills: [],
  category: "web",
};

const WEB_SECOND: Project = {
  title: "Retro Portfolio",
  period: "2024",
  description: "Second web card.",
  links: [],
  skills: [],
  category: "web",
};

const GRID: Project[] = [FULL, ML_SECOND, WEB_FIRST, WEB_SECOND];

afterEach(cleanup);

describe("ProjectCardGrid", () => {
  it("renders the title as a link to the project's slug", () => {
    render(<ProjectCardGrid projects={[FULL]} />);
    const link = screen.getByRole("link", { name: FULL.title });
    expect(link).toHaveAttribute("href", "/projects/ijo-plis-ihsg-usd-idr-forecasting-platform");
  });

  it("renders category, period and description straight from the data", () => {
    const { container } = render(<ProjectCardGrid projects={[FULL]} />);
    // Scoped to the card: post-hydration the filter chip row (M2.3.1) also
    // carries the label "Machine Learning", so an unscoped getByText would
    // strict-mode-collide two elements that are both correct.
    const card = container.querySelector("[data-project-card]");
    // `ml` is mapped through the one shared category vocabulary.
    expect(card).toHaveTextContent("Machine Learning");
    expect(card).toHaveTextContent("May 2026 – Jun 2026");
    expect(card).toHaveTextContent("Forecasting platform built on Prophet.");
  });

  it("caps skills at four chips plus an honest +N counter", () => {
    render(<ProjectCardGrid projects={[FULL]} />);
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("Prophet")).toBeInTheDocument();
    expect(screen.getByText("Django")).toBeInTheDocument();
    expect(screen.getByText("Docker")).toBeInTheDocument();
    // Fifth skill is not spelled out; it is counted instead.
    expect(screen.queryByText("Celery")).toBeNull();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("renders links as real external anchors with rel", () => {
    render(<ProjectCardGrid projects={[FULL]} />);
    const demo = screen.getByRole("link", { name: /Project Demo Url/ });
    expect(demo).toHaveAttribute("href", "https://example.com/demo");
    expect(demo).toHaveAttribute("target", "_blank");
    expect(demo).toHaveAttribute("rel", "noopener noreferrer");

    const repo = screen.getByRole("link", { name: /GitHub Repository/ });
    expect(repo).toHaveAttribute("href", "https://github.com/example/repo");
  });

  it("shows the association only when the data declares one", () => {
    const { unmount } = render(<ProjectCardGrid projects={[FULL]} />);
    expect(screen.getByText("Universitas AMIKOM Yogyakarta")).toBeInTheDocument();
    unmount();

    render(<ProjectCardGrid projects={[MINIMAL]} />);
    expect(screen.queryByText("Universitas AMIKOM Yogyakarta")).toBeNull();
    expect(document.querySelector("[data-project-association]")).toBeNull();
  });

  it("never renders media labels (they are not openable evidence)", () => {
    const { container } = render(<ProjectCardGrid projects={[FULL]} />);
    expect(container.textContent).not.toContain("IHSG Predictor");
    expect(container.textContent).not.toContain("IDR Predictor");
  });

  it("keeps the featured badge class the :has() CSS depends on", () => {
    const { container } = render(<ProjectCardGrid projects={[FULL]} />);
    expect(container.querySelector(".card .featured-badge")).toBeTruthy();
  });

  it("renders a card without skills or links without crashing, with a fallback", () => {
    const { container } = render(<ProjectCardGrid projects={[MINIMAL]} />);
    expect(screen.getByText("Bare Project")).toBeInTheDocument();
    expect(container.querySelector("[data-project-no-skills]")).toBeTruthy();
    expect(screen.getByText("No skills listed")).toBeInTheDocument();
    // No empty link row is emitted.
    expect(container.querySelectorAll("a[target='_blank']")).toHaveLength(0);
  });

  it("ships usable HTML before hydration (no dead controls)", () => {
    const markup = renderToStaticMarkup(<ProjectCardGrid projects={[FULL, MINIMAL]} />);
    // Real navigation is already present pre-hydration…
    expect(markup).toContain('href="/projects/ijo-plis-ihsg-usd-idr-forecasting-platform"');
    expect(markup).toContain('href="https://example.com/demo"');
    expect(markup).toContain('rel="noopener noreferrer"');
    // …and there is no inert control or inline handler anywhere.
    expect(markup).not.toContain("<button");
    expect(markup).not.toContain("onclick");
    expect(markup).toContain("No skills listed");
  });
});

/**
 * M2.3 — the category filter: `aria-pressed` chips inside a fieldset (never
 * `role="tab"`), a shareable `?f=` URL, an `<output>` empty state, and a reset.
 * Counts are derived from the grid's own cards, never typed by hand (Rule 7).
 */
describe("ProjectCardGrid — category filter (M2.3)", () => {
  const cardCount = (container: HTMLElement) =>
    container.querySelectorAll("[data-project-card]").length;

  // `?f=` is global state — restore it so tests cannot leak into each other.
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("ships no filter chrome in server HTML (post-hydration only)", () => {
    const markup = renderToStaticMarkup(<ProjectCardGrid projects={GRID} />);
    expect(markup).not.toContain("data-project-filter");
    expect(markup).not.toContain("<button");
  });

  it("derives one chip per category from this grid's cards (All 4 · ML 2 · Web 2 · zeros)", () => {
    render(<ProjectCardGrid projects={GRID} />);
    expect(screen.getByRole("button", { name: "All 4" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Machine Learning 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Web 2" })).toBeInTheDocument();
    // Zero-count chips stay present: they are what makes the empty state reachable.
    expect(screen.getByRole("button", { name: "IoT 0" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CLI & Tooling 0" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DevOps & MLOps 0" })).toBeInTheDocument();
  });

  it("filters the cards to the selected category and back to All", async () => {
    const user = userEvent.setup();
    const { container } = render(<ProjectCardGrid projects={GRID} />);
    expect(cardCount(container)).toBe(4);

    await user.click(screen.getByRole("button", { name: /^Machine Learning/ }));
    expect(cardCount(container)).toBe(2);
    expect(screen.getByText(FULL.title)).toBeInTheDocument();
    expect(screen.queryByText(WEB_FIRST.title)).toBeNull();
    expect(screen.queryByText(WEB_SECOND.title)).toBeNull();

    await user.click(screen.getByRole("button", { name: /^All/ }));
    expect(cardCount(container)).toBe(4);
    expect(screen.getByText(WEB_FIRST.title)).toBeInTheDocument();
  });

  it("keeps aria-pressed in sync with exactly one chip pressed", async () => {
    const user = userEvent.setup();
    render(<ProjectCardGrid projects={GRID} />);
    const all = screen.getByRole("button", { name: /^All/ });
    const web = screen.getByRole("button", { name: /^Web/ });
    const ml = screen.getByRole("button", { name: /^Machine Learning/ });

    expect(all).toHaveAttribute("aria-pressed", "true");
    expect(web).toHaveAttribute("aria-pressed", "false");
    expect(ml).toHaveAttribute("aria-pressed", "false");

    await user.click(web);
    expect(web).toHaveAttribute("aria-pressed", "true");
    expect(all).toHaveAttribute("aria-pressed", "false");
    expect(ml).toHaveAttribute("aria-pressed", "false");
    // Never two pressed chips at once.
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1);
  });

  it("reaches and activates chips with Tab, Enter and Space", async () => {
    const user = userEvent.setup();
    const { container } = render(<ProjectCardGrid projects={GRID} />);

    await user.tab();
    expect(screen.getByRole("button", { name: /^All/ })).toHaveFocus();
    await user.tab();
    await user.tab();
    expect(screen.getByRole("button", { name: /^Web/ })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(cardCount(container)).toBe(2);

    await user.tab();
    expect(screen.getByRole("button", { name: /^IoT/ })).toHaveFocus();
    await user.keyboard(" ");
    expect(cardCount(container)).toBe(0);
    expect(container.querySelector("output")).toBeTruthy();
  });

  it("shows an <output> empty state with a working reset for a 0-count category", async () => {
    const user = userEvent.setup();
    const { container } = render(<ProjectCardGrid projects={GRID} />);

    await user.click(screen.getByRole("button", { name: /^IoT/ }));
    expect(cardCount(container)).toBe(0);
    const output = container.querySelector("output.empty-state");
    expect(output).toBeTruthy();
    // The message names the active category (labels come from the vocabulary).
    expect(output?.textContent).toContain("No featured projects in");
    expect(output?.textContent).toContain("IoT");

    await user.click(screen.getByRole("button", { name: "Show all 4 projects" }));
    expect(cardCount(container)).toBe(4);
    expect(container.querySelector("output")).toBeNull();
    // The reset resets the state itself, not just the view.
    expect(screen.getByRole("button", { name: /^All/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("reads ?f= from the URL on mount (shareable deep link)", () => {
    window.history.replaceState({}, "", "/?f=web");
    const { container } = render(<ProjectCardGrid projects={GRID} />);
    expect(cardCount(container)).toBe(2);
    expect(screen.getByRole("button", { name: /^Web/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("drops an unknown ?f= token instead of guessing", () => {
    window.history.replaceState({}, "", "/?f=bogus");
    const { container } = render(<ProjectCardGrid projects={GRID} />);
    expect(cardCount(container)).toBe(4);
    expect(window.location.search).toBe("");
  });

  it("writes the active filter into the URL and removes it for All", async () => {
    window.history.replaceState({}, "", "/");
    const user = userEvent.setup();
    render(<ProjectCardGrid projects={GRID} />);

    await user.click(screen.getByRole("button", { name: /^Web/ }));
    expect(window.location.search).toBe("?f=web");

    await user.click(screen.getByRole("button", { name: /^All/ }));
    expect(window.location.search).toBe("");
  });
});
