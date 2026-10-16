import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ChartDataTable from "./ChartDataTable";

describe("ChartDataTable (M4.7)", () => {
  const props = {
    id: "languages-radial",
    caption: "Languages by share",
    headers: ["Language", "Share"],
    rows: [
      ["TypeScript", 42.5],
      ["Python", 30],
    ],
  };

  it("renders a captioned table with scoped headers and one row per datum", () => {
    render(<ChartDataTable {...props} />);
    const table = screen.getByRole("table");
    expect(table).toHaveAttribute("data-chart-table", "languages-radial");
    expect(screen.getByText("Languages by share")).toBeInTheDocument();
    const headers = screen.getAllByRole("columnheader");
    expect(headers.map((h) => h.textContent)).toEqual(["Language", "Share"]);
    expect(headers[0]).toHaveAttribute("scope", "col");
    expect(screen.getByRole("row", { name: "TypeScript 42.5" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: "Python 30" })).toBeInTheDocument();
  });

  it("is visually hidden but present in markup (SSR/no-JS readers)", () => {
    const { container } = render(<ChartDataTable {...props} />);
    expect(container.querySelector("table.sr-only")).not.toBeNull();
  });
});
