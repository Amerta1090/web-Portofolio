import { fireEvent, render, waitFor } from "@testing-library/react";
import { animateView } from "motion";
import { afterEach, describe, expect, it, vi } from "vitest";
import GalleryGrid from "./GalleryGrid";

// Stub hanya API JS `animateView` dari "motion"; `motion/react` (AnimatePresence,
// motion) tetap asli agar rendering modal deterministik di jsdom.
vi.mock("motion", () => {
  const chain = {
    add: () => chain,
    old: () => chain,
    new: () => chain,
    crop: () => chain,
    enter: () => chain,
    exit: () => chain,
  };
  return {
    animateView: vi.fn(() => chain),
    spring: { type: "spring" },
  };
});

const stubViewTransitions = () => {
  Object.defineProperty(document, "startViewTransition", {
    configurable: true,
    value: vi.fn((cb: () => void) => {
      cb();
      return { ready: Promise.resolve(), finished: Promise.resolve() };
    }),
  });
};

const clearViewTransitions = () => {
  // defineProperty di stubViewTransitions tidak menyetel writable -> assignment
  // `= undefined` melempar TypeError. delete aman karena configurable:true.
  Reflect.deleteProperty(document, "startViewTransition");
};

const openCard = (id: string) => {
  // Bersihkan hash dari test sebelumnya: deep-link effect GalleryGrid
  // (setTimeout 300ms) auto-launch bila hash cocok -> call animateView kedua
  // membuat asersi toHaveBeenCalledTimes flaky (bug laten yang terekspos
  // lazy-loading: timing render modal berubah).
  history.replaceState(null, "", window.location.pathname);
  const { container } = render(<GalleryGrid />);
  const card = container.querySelector(`[data-exp-id="${id}"]`);
  expect(card).not.toBeNull();
  fireEvent.click(card as HTMLElement);
  return container;
};

describe("GalleryGrid animateView (Phase D)", () => {
  afterEach(() => {
    clearViewTransitions();
    vi.clearAllMocks();
  });

  it("membuka modal langsung (tanpa morph) bila View Transitions tak didukung", async () => {
    // jsdom default: document.startViewTransition undefined -> fallback polos
    const container = openCard("liquid-distortion");
    await waitFor(() => expect(container.querySelector("[data-modal-content]")).not.toBeNull());
    expect(vi.mocked(animateView)).not.toHaveBeenCalled();
  });

  it("fallback tetap membuka modal bila animateView melempar di tengah jalur VT", async () => {
    stubViewTransitions();
    vi.mocked(animateView).mockImplementationOnce(() => {
      throw new Error("view transition blocked");
    });

    const container = openCard("liquid-distortion");
    await waitFor(() => expect(container.querySelector("[data-modal-content]")).not.toBeNull());
    expect(vi.mocked(animateView)).toHaveBeenCalledTimes(1);
  });

  it("morph kartu->modal berjalan via animateView (.add(from, panel)) + spring", async () => {
    stubViewTransitions();
    type Builder = ReturnType<typeof animateView>;
    const builder: Builder = {
      add: () => builder,
      old: () => builder,
      new: () => builder,
      crop: () => builder,
      enter: () => builder,
      exit: () => builder,
    } as unknown as Builder;
    const addMock = vi.fn(() => builder);
    builder.add = addMock;
    vi.mocked(animateView).mockImplementationOnce((update: () => void) => {
      update(); // flushSync(setActiveExperiment) => modal ter-mount sinkron
      return builder;
    });

    const container = openCard("fourier-epicycles");

    await waitFor(() => expect(container.querySelector("[data-modal-content]")).not.toBeNull());
    expect(container.querySelector('[data-modal-panel="true"]')).not.toBeNull();

    expect(addMock).toHaveBeenCalledWith(expect.any(HTMLElement), "[data-modal-panel]");
    const [fromEl] = addMock.mock.calls[0] as unknown as [HTMLElement];
    expect(fromEl).toHaveAttribute("data-exp-id", "fourier-epicycles");
  });
});
