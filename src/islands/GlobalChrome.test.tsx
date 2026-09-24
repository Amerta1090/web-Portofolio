import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GlobalChrome from "./GlobalChrome";

const toasterPosition: string[] = [];

vi.mock("./AssistantBot", () => ({
  default: () => (
    <button aria-label="Buka assistant detAIministic" type="button">
      FAB
    </button>
  ),
}));

vi.mock("./CommandPalette", () => ({
  default: () => <div data-testid="palette" />,
  PALETTE_OPEN_EVENT: "opencode:palette",
}));

vi.mock("./CustomCursor", () => ({
  default: () => null,
}));

vi.mock("sonner", () => ({
  Toaster: (props: { position: string }) => {
    toasterPosition.push(props.position);
    return <div data-testid="toaster" />;
  },
}));

describe("GlobalChrome (composite: Toaster + AssistantBot + CommandPalette + CustomCursor)", () => {
  it("renders assistant FAB, palette and toaster in one root", () => {
    render(<GlobalChrome />);
    expect(screen.getByLabelText("Buka assistant detAIministic")).toBeInTheDocument();
    expect(screen.getByTestId("palette")).toBeInTheDocument();
    expect(screen.getByTestId("toaster")).toBeInTheDocument();
  });

  it("keeps the toaster anchored bottom-right", () => {
    render(<GlobalChrome />);
    expect(toasterPosition).toContain("bottom-right");
  });

  it("mounts without throwing (CustomCursor renders null)", () => {
    expect(() => render(<GlobalChrome />)).not.toThrow();
  });
});
