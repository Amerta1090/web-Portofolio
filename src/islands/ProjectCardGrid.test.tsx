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
 *
 * Task 2.4: the detail URL is resolved on the server (`projectHref`) and handed
 * to the island, so the fixtures carry the `href` the page would pass.
 */
type CardProject = Project & { href: string };

const FULL: CardProject = {
  title: "IJO PLIS — IHSG & USD/IDR Forecasting Platform",
  href: "/projects/ijo-plis-ihsg-usd-idr-forecasting-platform",
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

const MINIMAL: CardProject = {
  title: "Bare Project",
  href: "/projects/bare-project",
  period: "",
  description: "Has neither skills nor links.",
  links: [],
  skills: [],
};

afterEach(cleanup);

describe("ProjectCardGrid", () => {
  it("renders the title as a link to the server-resolved project href", () => {
    render(<ProjectCardGrid projects={[FULL]} />);
    const link = screen.getByRole("link", { name: FULL.title });
    // The href is `projectHref(project)` resolved on the server (Task 2.4), so
    // the island never carries the slug rule into the client bundle.
    expect(link).toHaveAttribute("href", FULL.href);
  });

  it("renders category, period and description straight from the data", () => {
    const { container } = render(<ProjectCardGrid projects={[FULL]} />);
    // Scoped to the card: the grid is the only surface that names a category,
    // but scoping keeps the assertion honest if another surface ever does.
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

  it("uses image_alt when the picture needs more than the project title (MOTION-11)", () => {
    const withAlt: CardProject = {
      ...FULL,
      image_alt: "Retrieval system map: BM25 and E5 fused into one grounded prompt",
    };
    render(<ProjectCardGrid projects={[withAlt]} />);
    expect(
      screen.getByRole("img", {
        name: "Retrieval system map: BM25 and E5 fused into one grounded prompt",
      }),
    ).toBeInTheDocument();
  });

  it("renders an intentional no-image card when the project owns no evidence (MOTION-11)", () => {
    const { container } = render(<ProjectCardGrid projects={[MINIMAL]} />);
    const card = container.querySelector("[data-project-card]");
    expect(card).toHaveAttribute("data-project-no-image");
    expect(card?.querySelector("img")).toBeNull();
    // The evidence gap is never filled with generic placeholder art.
    expect(container.innerHTML).not.toContain("placeholder/project.svg");
  });

  it("gives the no-image card roomier padding instead of an empty media box", () => {
    const { container } = render(<ProjectCardGrid projects={[MINIMAL]} />);
    const content = container.querySelector("[data-project-card] > div");
    expect(content?.className).toContain("p-6");
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
    expect(markup).toContain(`href="${FULL.href}"`);
    expect(markup).toContain('href="https://example.com/demo"');
    expect(markup).toContain('rel="noopener noreferrer"');
    // …and there is no inert control or inline handler anywhere.
    expect(markup).not.toContain("<button");
    expect(markup).not.toContain("onclick");
    expect(markup).toContain("No skills listed");
  });
});

/**
 * M2.4 — the skill chip is a cross-link into the Capability Map. The island is a
 * dumb renderer: the server (`buildSkillHrefs`) resolves *every* skill, so the
 * fallback string and the data layer never ship in this bundle.
 */
describe("ProjectCardGrid — skill → Capability Map cross-link (M2.4)", () => {
  const SKILL_HREFS: Record<string, string> = {
    Python: "#signal-capability-programming-languages",
    // `Prophet` is placed by no declared capability → honest section fallback.
    Prophet: "#systems-in-motion",
    Django: "#signal-capability-web-development",
    Docker: "#signal-capability-devops-mlops",
  };

  it("turns each skill chip into a link to its resolved node (M2.4.1)", () => {
    render(<ProjectCardGrid projects={[FULL]} skillHrefs={SKILL_HREFS} />);
    expect(screen.getByRole("link", { name: "Python" })).toHaveAttribute(
      "href",
      "#signal-capability-programming-languages",
    );
    expect(screen.getByRole("link", { name: "Django" })).toHaveAttribute(
      "href",
      "#signal-capability-web-development",
    );
  });

  it("keeps the honest section fallback for a skill the map cannot place (M2.4.3)", () => {
    render(<ProjectCardGrid projects={[FULL]} skillHrefs={SKILL_HREFS} />);
    // Still a real link — it lands on the section, not on an invented node.
    expect(screen.getByRole("link", { name: "Prophet" })).toHaveAttribute(
      "href",
      "#systems-in-motion",
    );
  });

  it("ships the chip links in the pre-hydration HTML (no dead controls)", () => {
    const markup = renderToStaticMarkup(
      <ProjectCardGrid projects={[FULL]} skillHrefs={SKILL_HREFS} />,
    );
    expect(markup).toContain('href="#signal-capability-programming-languages"');
    expect(markup).toContain('href="#systems-in-motion"');
    expect(markup).not.toContain("<button");
  });

  it("never fabricates an href for a skill the map does not carry", () => {
    // Defensive: the server always resolves every skill, so this cannot happen
    // from the page — but the island must not invent a link on its own.
    render(
      <ProjectCardGrid
        projects={[FULL]}
        skillHrefs={{ Python: "#signal-capability-programming-languages" }}
      />,
    );
    expect(screen.queryByRole("link", { name: "Prophet" })).toBeNull();
    expect(screen.getByText("Prophet")).toBeInTheDocument();
  });
});
