import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NetworkGraph from "./NetworkGraph";

/**
 * M4.7: the sr-only tables carry the same node/link arrays the force
 * simulation draws. The d3 effect may or may not fully run in jsdom — these
 * assertions only touch the plain-JSX tables, which render from props.
 */
describe("NetworkGraph data tables (M4.7)", () => {
  const nodes = [
    { id: "a", label: "Repo A", group: "TypeScript", size: 10 },
    { id: "b", label: "Repo B", group: "Python", size: 4 },
  ];
  const links = [{ source: "a", target: "b", label: "shares-lang" }];

  it("renders node + link tables with one row per datum", () => {
    render(<NetworkGraph nodes={nodes} links={links} width={400} height={300} />);
    const nodeTable = screen.getByRole("table", { name: "Repositories in the network graph" });
    expect(within(nodeTable).getByRole("row", { name: "Repo A TypeScript 10" })).toBeInTheDocument();
    expect(within(nodeTable).getByRole("row", { name: "Repo B Python 4" })).toBeInTheDocument();
    const linkTable = screen.getByRole("table", { name: "Links in the network graph" });
    expect(within(linkTable).getByRole("row", { name: "a b" })).toBeInTheDocument();
  });
});
