import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AssistantBot from "./AssistantBot";

// Replace framer-motion with plain passthrough components so AnimatePresence
// exit does not retain elements in jsdom (deterministic mount/unmount).
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  const passthrough =
    (tag: string) =>
    ({ children, ...props }: Record<string, unknown>) =>
      // @ts-expect-error dynamic tag
      <tag {...props}>{children}</tag>;
  return {
    ...actual,
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    motion: {
      div: passthrough("div"),
      button: passthrough("button"),
    },
  };
});

function setReducedMotion(matches: boolean) {
  const impl = (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn(impl),
  });
}

describe("AssistantBot", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    window.history.replaceState({}, "", "/");
    setReducedMotion(true); // deterministic: replies are instant
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the floating action button", () => {
    render(<AssistantBot />);
    const fab = screen.getByLabelText("Buka assistant detAIministic");
    expect(fab).toBeTruthy();
  });

  it("opens the drawer when the FAB is clicked", async () => {
    const user = userEvent.setup();
    render(<AssistantBot />);
    await user.click(screen.getByLabelText("Buka assistant detAIministic"));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("detAIministic assistant")).toBeTruthy();
    expect(screen.getByText(/deterministic · no LLM/)).toBeTruthy();
  });

  it("renders FAQ quick-pick chips", async () => {
    const user = userEvent.setup();
    render(<AssistantBot />);
    await user.click(screen.getByLabelText("Buka assistant detAIministic"));
    const dialog = screen.getByRole("dialog");
    // At least the skills chip text should be present.
    const chip = within(dialog).getAllByRole("button").find((b) => /skill/i.test(b.textContent ?? ""));
    expect(chip).toBeTruthy();
  });

  it("sends a message and receives an assistant reply", async () => {
    const user = userEvent.setup();
    render(<AssistantBot />);
    await user.click(screen.getByLabelText("Buka assistant detAIministic"));

    const input = screen.getByLabelText("Pesan ke assistant");
    await user.type(input, "skill apa saja?{Enter}");

    // User message bubble appears.
    expect(screen.getByText("skill apa saja?")).toBeTruthy();
    // Assistant reply appears (reduced motion => instant, full text).
    const dialog = screen.getByRole("dialog");
    const bubbles = within(dialog).getAllByRole("status");
    expect(bubbles.length).toBeGreaterThan(0);
  });

  it("sends a reply from a quick-pick chip", async () => {
    const user = userEvent.setup();
    render(<AssistantBot />);
    await user.click(screen.getByLabelText("Buka assistant detAIministic"));

    const dialog = screen.getByRole("dialog");
    const chip = within(dialog).getAllByRole("button").find((b) => /skill/i.test(b.textContent ?? ""));
    expect(chip).toBeTruthy();
    await user.click(chip!);

    const bubbles = within(dialog).getAllByRole("status");
    expect(bubbles.length).toBeGreaterThan(0);
  });

  it("reset clears the conversation", async () => {
    const user = userEvent.setup();
    render(<AssistantBot />);
    await user.click(screen.getByLabelText("Buka assistant detAIministic"));

    const input = screen.getByLabelText("Pesan ke assistant");
    await user.type(input, "halo{Enter}");
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);

    await user.click(screen.getByLabelText("Reset percakapan"));
    expect(screen.queryAllByRole("status").length).toBe(0);
  });

  it("closes the drawer with the close button", async () => {
    const user = userEvent.setup();
    render(<AssistantBot />);
    await user.click(screen.getByLabelText("Buka assistant detAIministic"));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeTruthy();
    const closeBtn = within(dialog).getAllByRole("button").find((b) => b.getAttribute("aria-label") === "Tutup assistant");
    expect(closeBtn).toBeTruthy();
    await user.click(closeBtn!);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the engine transparency modal and shows copy", async () => {
    const user = userEvent.setup();
    render(<AssistantBot />);
    await user.click(screen.getByLabelText("Buka assistant detAIministic"));
    await user.click(screen.getByLabelText("Buka engine"));

    expect(screen.getByText("Cara kerja engine")).toBeTruthy();
    expect(screen.getByText(/100% deterministik/i)).toBeTruthy();

    // Close the modal.
    await user.click(screen.getByText("Mengerti"));
    expect(screen.queryByText("Cara kerja engine")).toBeNull();
  });

  it("closes the drawer on Escape", async () => {
    const user = userEvent.setup();
    render(<AssistantBot />);
    await user.click(screen.getByLabelText("Buka assistant detAIministic"));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
