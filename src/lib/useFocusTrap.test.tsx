import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFocusTrap } from "./useFocusTrap";

// rAF tidak ada di jsdom → stub sinkron agar initial focus deterministik.
beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

function Fixture({
  enabled = true,
  initialFocus,
  restoreFocus = true,
}: {
  enabled?: boolean;
  initialFocus?: string;
  restoreFocus?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useFocusTrap({ containerRef: ref, enabled, initialFocus, restoreFocus });
  return (
    <dialog ref={ref} open aria-label="trap fixture">
      <button type="button" id="first">
        Pertama
      </button>
      <button type="button" id="second">
        Kedua
      </button>
      <button type="button" id="last">
        Ketiga
      </button>
    </dialog>
  );
}

function addOutsideButton() {
  const btn = document.createElement("button");
  btn.id = "outside";
  btn.textContent = "Di luar";
  document.body.appendChild(btn);
  return btn;
}

describe("useFocusTrap", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    document.getElementById("outside")?.remove();
  });

  it("fokus ke elemen focusable pertama saat diaktifkan", () => {
    render(<Fixture />);
    expect(document.activeElement).toBe(screen.getByText("Pertama"));
  });

  it("fokus ke elemen yang cocok dengan initialFocus selector", () => {
    render(<Fixture initialFocus="#second" />);
    expect(document.activeElement).toBe(screen.getByText("Kedua"));
  });

  it("membungkus Tab maju dari elemen terakhir ke pertama", () => {
    render(<Fixture />);
    const last = screen.getByText("Ketiga");
    last.focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByText("Pertama"));
  });

  it("membungkus Shift+Tab dari elemen pertama ke terakhir", () => {
    render(<Fixture />);
    const first = screen.getByText("Pertama");
    first.focus();
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(screen.getByText("Ketiga"));
  });

  it("meng-anchor ulang fokus dari luar kontainer ke dalam trap", () => {
    const outside = addOutsideButton();
    render(<Fixture />);
    outside.focus();
    expect(document.activeElement).toBe(outside);
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByText("Pertama"));
  });

  it("tidak menjebak fokus saat disabled", () => {
    const outside = addOutsideButton();
    render(<Fixture enabled={false} />);
    outside.focus();
    expect(document.activeElement).toBe(outside);
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(outside);
  });

  it("mengembalikan fokus ke elemen sebelumnya saat dinonaktifkan", () => {
    const outside = addOutsideButton();
    outside.focus();
    const { rerender } = render(<Fixture />);
    expect(document.activeElement).toBe(screen.getByText("Pertama"));
    rerender(<Fixture enabled={false} />);
    expect(document.activeElement).toBe(outside);
  });

  it("mengembalikan fokus saat unmount", () => {
    const outside = addOutsideButton();
    outside.focus();
    const { unmount } = render(<Fixture />);
    unmount();
    expect(document.activeElement).toBe(outside);
  });

  it("menjaga fokus di dalam dialog anak (bertingkat)", () => {
    // Dialog anak di dalam kontainer: Tab dari tombolnya tidak boleh
    // melompat ke focusable pertama kontainer induk.
    const nested = document.createElement("div");
    nested.setAttribute("role", "dialog");
    nested.setAttribute("aria-modal", "true");
    nested.id = "nested";
    const nestedBtn = document.createElement("button");
    nestedBtn.id = "nested-btn";
    nestedBtn.textContent = "Dalam";
    nested.appendChild(nestedBtn);
    document.body.appendChild(nested);

    render(<Fixture />);
    // Fokus di luar kontainer trap → scope fallback kontainer → fokus pertama.
    nestedBtn.focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(nestedBtn);
    nested.remove();
  });

  it("membersihkan listener keyboard saat unmount", () => {
    const outside = addOutsideButton();
    outside.focus();
    const { unmount } = render(<Fixture />);
    expect(document.activeElement).toBe(screen.getByText("Pertama"));
    unmount();
    // Setelah unmount, Tab tidak boleh memindahkan fokus lagi.
    outside.focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(outside);
  });
});
