import "@testing-library/jest-dom/vitest";

// Polyfill ResizeObserver for jsdom
if (typeof ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
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
