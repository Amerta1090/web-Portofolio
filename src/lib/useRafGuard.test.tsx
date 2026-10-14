import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRafGuard } from "./useRafGuard";

function Probe({
  respectReducedMotion = false,
  respectReducedData = false,
}: {
  respectReducedMotion?: boolean;
  respectReducedData?: boolean;
}) {
  const guard = useRafGuard(undefined, respectReducedMotion, respectReducedData);
  return (
    <div
      ref={guard.ref}
      data-testid="probe"
      data-paused={guard.paused}
      data-visible={guard.visible}
      data-hidden={guard.hidden}
    />
  );
}

describe("useRafGuard", () => {
  beforeEach(() => {
    // jsdom tanpa IntersectionObserver → fallback visible (perilaku lama deterministik)
    vi.stubGlobal("IntersectionObserver", undefined);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("paused=false secara default di jsdom (tanpa IntersectionObserver)", () => {
    const { getByTestId } = render(<Probe />);
    const el = getByTestId("probe");
    expect(el.dataset.paused).toBe("false");
    expect(el.dataset.visible).toBe("true");
    expect(el.dataset.hidden).toBe("false");
  });

  it("paused=true saat tab hidden (visibilitychange)", () => {
    const original = document.hidden;
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    const { getByTestId } = render(<Probe />);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    const el = getByTestId("probe");
    expect(el.dataset.hidden).toBe("true");
    expect(el.dataset.paused).toBe("true");
    document.dispatchEvent(new Event("visibilitychange"));
    Object.defineProperty(document, "hidden", { configurable: true, value: original });
  });

  it("paused=true saat elemen keluar viewport (IntersectionObserver tersedia)", () => {
    let callback: IntersectionObserverCallback | undefined;
    class FakeIO {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", function (
      this: unknown,
      cb: IntersectionObserverCallback,
    ) {
      callback = cb;
      return new FakeIO();
    } as unknown as typeof IntersectionObserver);

    const { getByTestId } = render(<Probe />);
    act(() => {
      callback?.(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    const el = getByTestId("probe");
    expect(el.dataset.visible).toBe("false");
    expect(el.dataset.paused).toBe("true");
  });

  it("respectReducedMotion=true → paused saat prefers-reduced-motion", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const listeners: Array<(e: { matches: boolean }) => void> = [];
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => listeners.push(cb),
        removeEventListener: () => {},
      })),
    );
    const { getByTestId } = render(<Probe respectReducedMotion />);
    const el = getByTestId("probe");
    expect(el.dataset.paused).toBe("true");
  });

  it("respectReducedData=true → paused saat prefers-reduced-data (M4.1.3)", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-data"),
        addEventListener: () => {},
        removeEventListener: () => {},
      })),
    );
    const { getByTestId } = render(<Probe respectReducedData />);
    const el = getByTestId("probe");
    expect(el.dataset.paused).toBe("true");
  });

  it("reduced-data diabaikan bila flag-nya off (default tak berubah)", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const seen: string[] = [];
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => {
        seen.push(query);
        return {
          matches: query.includes("prefers-reduced-data"),
          addEventListener: () => {},
          removeEventListener: () => {},
        };
      }),
    );
    const { getByTestId } = render(<Probe />);
    const el = getByTestId("probe");
    // Query reduced-data tak pernah didaftarkan, dan paused tetap false walau
    // media-nya matches — perilaku lama untuk ~30 pemanggil existing terjaga.
    expect(seen).not.toContain("(prefers-reduced-data: reduce)");
    expect(el.dataset.paused).toBe("false");
  });
});
