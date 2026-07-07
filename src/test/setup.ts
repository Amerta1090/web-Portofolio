import "@testing-library/jest-dom/vitest";

// Polyfill ResizeObserver for jsdom
if (typeof ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}
