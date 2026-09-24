import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HeaderTools from "./HeaderTools";

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return { ...actual, useReducedMotion: () => false };
});

describe("HeaderTools (composite: ThemeCustomizer + GameMenuWrapper)", () => {
  it("renders the game menu trigger button", () => {
    render(<HeaderTools />);
    expect(screen.getByRole("button", { name: "Open Menu" })).toBeInTheDocument();
  });

  it("renders the theme customizer trigger alongside the menu", () => {
    render(<HeaderTools />);
    expect(screen.getByRole("button", { name: "Theme customizer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Menu" })).toBeInTheDocument();
  });

  it("mounts without throwing", () => {
    expect(() => render(<HeaderTools />)).not.toThrow();
  });
});
