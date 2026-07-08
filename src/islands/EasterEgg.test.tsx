import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import EasterEgg from "./EasterEgg";

describe("EasterEgg", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders without crashing", () => {
    const { container } = render(<EasterEgg />);
    expect(container.firstChild).toBeNull();
  });

  it("accepts onActivate callback", () => {
    const onActivate = vi.fn();
    render(<EasterEgg onActivate={onActivate} />);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it("works with konamiCode disabled", () => {
    const { container } = render(<EasterEgg konamiCode={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("works with empty hiddenZones", () => {
    const { container } = render(<EasterEgg hiddenZones={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("works with empty consoleSecrets", () => {
    const { container } = render(<EasterEgg consoleSecrets={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("accepts custom hiddenZones", () => {
    const customZones = [
      {
        name: "secret-button",
        selector: ".secret-btn",
        message: "You found it!",
      },
    ];
    const { container } = render(<EasterEgg hiddenZones={customZones} />);
    expect(container.firstChild).toBeNull();
  });

  it("accepts custom consoleSecrets", () => {
    const customSecrets = [
      {
        trigger: "magic",
        response: "✨ Magic activated!",
      },
    ];
    const { container } = render(<EasterEgg consoleSecrets={customSecrets} />);
    expect(container.firstChild).toBeNull();
  });

  it("fires onActivate for Konami code", () => {
    const onActivate = vi.fn();
    render(<EasterEgg onActivate={onActivate} />);

    const keys = [
      "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
      "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
      "b", "a",
    ];
    for (const key of keys) {
      window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    }

    expect(onActivate).toHaveBeenCalledWith("konami-code");
  });

  it("resets Konami sequence on wrong key", () => {
    const onActivate = vi.fn();
    render(<EasterEgg onActivate={onActivate} />);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

    expect(onActivate).not.toHaveBeenCalled();
  });

  it("creates toast on Konami activation", () => {
    render(<EasterEgg />);

    const keys = [
      "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
      "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
      "b", "a",
    ];
    for (const key of keys) {
      window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    }

    const toast = document.body.querySelector('[class*="fixed"]');
    expect(toast).toBeTruthy();
    expect(toast?.textContent).toContain("KONAMI CODE ACTIVATED");
  });

  it("hidden zone click creates toast", () => {
    document.body.innerHTML = '<div class="logo">Logo</div>';
    render(<EasterEgg />);

    const logo = document.querySelector('.logo') as HTMLElement;
    logo?.click();

    const toast = document.body.querySelector('[class*="fixed"]');
    expect(toast).toBeTruthy();
  });
});
