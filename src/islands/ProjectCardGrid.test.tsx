import { cleanup, render, screen } from "@testing-library/react";
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

afterEach(cleanup);

describe("ProjectCardGrid", () => {
  it("renders the title as a link to the project's slug", () => {
    render(<ProjectCardGrid projects={[FULL]} />);
    const link = screen.getByRole("link", { name: FULL.title });
    expect(link).toHaveAttribute("href", "/projects/ijo-plis-ihsg-usd-idr-forecasting-platform");
  });

  it("renders category, period and description straight from the data", () => {
    render(<ProjectCardGrid projects={[FULL]} />);
    // `ml` is mapped through the one shared category vocabulary.
    expect(screen.getByText("Machine Learning")).toBeInTheDocument();
    expect(screen.getByText("May 2026 – Jun 2026")).toBeInTheDocument();
    expect(screen.getByText("Forecasting platform built on Prophet.")).toBeInTheDocument();
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
