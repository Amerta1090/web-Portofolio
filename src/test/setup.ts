import "@testing-library/jest-dom/vitest";

// Polyfill ResizeObserver for jsdom
if (typeof ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}

// Polyfill matchMedia for jsdom — `gsap.registerPlugin(ScrollTrigger)` reads it
// at module scope (gsap-core.js `MatchMedia.add`), so importing `src/lib/gsap.ts`
// throws `matchMedia is not a function` before any test body runs. jsdom ships
// no matchMedia at all, which is why no unit test could touch ScrollTrigger
// until this existed. Defaults to `matches: false` so tests that DO exercise a
// reduced-motion branch keep stubbing matchMedia themselves.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

// Polyfill IntersectionObserver for jsdom — motion's `whileInView` (viewport
// feature) constructs IO lazily on mount; without it tests of components using
// `whileInView` (e.g. RepoGlowCard via TopReposLeaderboard) throw.
if (typeof IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = class IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds = [0];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
}
