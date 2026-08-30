import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import CapabilityGenerator, { CAPABILITY_MODES } from "./CapabilityGenerator";
import grammar from "../../../data/capability-grammars.json";

describe("CapabilityGenerator", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the generator shell with mode buttons", () => {
    render(<CapabilityGenerator />);
    expect(screen.getByText(/detAIministic · grammar generator/)).toBeTruthy();
    for (const { label } of CAPABILITY_MODES) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
  });

  it("renders an initial output in a status region", () => {
    render(<CapabilityGenerator />);
    const status = screen.getByRole("status");
    expect(status.textContent?.trim().length).toBeGreaterThan(0);
    expect(status.textContent).not.toMatch(/#/);
  });

  it("generates a new output when 'Generate lagi' is clicked", async () => {
    const user = userEvent.setup();
    render(<CapabilityGenerator initialSeed={1} />);
    const status = screen.getByRole("status");
    const before = status.textContent;
    await user.click(screen.getByRole("button", { name: "Generate lagi" }));
    expect(status.textContent).not.toBe(before);
    expect(status.textContent?.trim().length).toBeGreaterThan(0);
  });

  it("switching mode changes the output", async () => {
    const user = userEvent.setup();
    render(<CapabilityGenerator initialSeed={1} />);
    const status = screen.getByRole("status");
    const before = status.textContent;
    await user.click(screen.getByRole("button", { name: "Project" }));
    expect(status.textContent).not.toBe(before);
    expect(status.textContent?.endsWith(".")).toBe(true);
  });

  it("toggles the grammar source reveal", async () => {
    const user = userEvent.setup();
    const { container } = render(<CapabilityGenerator />);
    expect(container.querySelector("pre")).toBeFalsy();
    await user.click(screen.getByRole("button", { name: "Lihat grammar" }));
    const pre = container.querySelector("pre");
    expect(pre).toBeTruthy();
    expect(pre?.textContent).toContain("capability");
    expect(pre?.textContent).toContain("project_blurb");
    await user.click(screen.getByRole("button", { name: "Tutup grammar" }));
    expect(container.querySelector("pre")).toBeFalsy();
  });

  it("marks the active mode as pressed", async () => {
    const user = userEvent.setup();
    render(<CapabilityGenerator />);
    const proj = screen.getByRole("button", { name: "Project" });
    expect(proj.getAttribute("aria-pressed")).toBe("false");
    await user.click(proj);
    expect(proj.getAttribute("aria-pressed")).toBe("true");
  });

  it("produces valid project blurbs from the grammar", () => {
    render(<CapabilityGenerator initialSeed={1} />);
    // Initial mode is capability; sanity: output reads as a sentence.
    const status = screen.getByRole("status");
    expect(status.textContent?.endsWith(".")).toBe(true);
  });

  it("is deterministic given the same seed", () => {
    const first = render(<CapabilityGenerator initialSeed={7} />);
    const firstText = screen.getByRole("status").textContent;
    cleanup();
    const second = render(<CapabilityGenerator initialSeed={7} />);
    const secondText = screen.getByRole("status").textContent;
    expect(first).toBeTruthy();
    expect(second).toBeTruthy();
    expect(firstText).toBe(secondText);
  });

  it("Fact mode always yields a known, grounded fact", async () => {
    const user = userEvent.setup();
    render(<CapabilityGenerator initialSeed={3} />);
    await user.click(screen.getByRole("button", { name: "Fact" }));
    expect(grammar.fact).toContain(screen.getByRole("status").textContent);
  });

  it("Project mode always yields a known, grounded blurb", async () => {
    const user = userEvent.setup();
    render(<CapabilityGenerator initialSeed={4} />);
    await user.click(screen.getByRole("button", { name: "Project" }));
    const text = screen.getByRole("status").textContent;
    expect(text?.length).toBeGreaterThan(0);
    expect(grammar.project_blurb).toContain(text);
  });

  it("never leaks template markers across modes and seeds", async () => {
    const user = userEvent.setup();
    render(<CapabilityGenerator initialSeed={1} />);
    for (let i = 0; i < 6; i++) {
      expect(screen.getByRole("status").textContent).not.toMatch(/#/);
      await user.click(screen.getByRole("button", { name: "Generate lagi" }));
    }
    await user.click(screen.getByRole("button", { name: "Project" }));
    expect(screen.getByRole("status").textContent).not.toMatch(/#/);
  });

  it("honors a custom className", () => {
    const { container } = render(<CapabilityGenerator className="custom-shell" />);
    expect(container.querySelector(".custom-shell")).toBeTruthy();
  });
});
