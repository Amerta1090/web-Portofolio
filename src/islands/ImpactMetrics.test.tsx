import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ImpactMetrics from "./ImpactMetrics";

/**
 * M1.6.1 — the About numbers link to their evidence. A metric with an `href`
 * renders its whole card as one link; a metric without one stays a plain
 * `<div>`, so figures with no single section to point at can never become
 * dead controls.
 */
describe("ImpactMetrics links", () => {
  it("renders the card as a link when the metric carries an href", () => {
    render(
      <ImpactMetrics
        metrics={[{ label: "Projects Shipped", value: 22, suffix: "+", href: "#career" }]}
      />,
    );

    const link = screen.getByRole("link", { name: /projects shipped/i });
    expect(link).toHaveAttribute("href", "#career");
    expect(link.textContent).toContain("22");
  });

  it("keeps the card a plain div when the metric has no href", () => {
    const { container } = render(
      <ImpactMetrics metrics={[{ label: "Languages", value: 4, suffix: "" }]} />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(container.textContent).toContain("Languages");
    expect(container.textContent).toContain("4");
  });

  it("links exactly the metrics that name evidence, and no others", () => {
    render(
      <ImpactMetrics
        metrics={[
          { label: "Years Experience", value: 2, suffix: "+" },
          { label: "Projects Shipped", value: 22, suffix: "+", href: "#career" },
          { label: "Certifications", value: 62, suffix: "", href: "#certifications" },
          { label: "Languages", value: 4, suffix: "" },
        ]}
      />,
    );

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links.map((link) => link.getAttribute("href")).sort()).toEqual([
      "#career",
      "#certifications",
    ]);
  });
});
