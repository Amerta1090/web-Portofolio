import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

let reduced: boolean | null = true;
vi.mock("motion/react", () => ({ useReducedMotion: () => reduced }));

import { useHydratedReducedMotion } from "./useHydratedReducedMotion";

function Probe() {
  const prefersReduced = useHydratedReducedMotion();
  return <span data-reduced={String(prefersReduced)}>{prefersReduced ? "static" : "animated"}</span>;
}

afterEach(() => {
  reduced = true;
  document.body.innerHTML = "";
});

describe("useHydratedReducedMotion", () => {
  it("hydrates server markup rendered without the preference, then applies it", async () => {
    // The server cannot see the preference; motion's hook would answer `true`
    // on the first client render and break hydration (#418).
    reduced = null;
    const html = renderToString(<Probe />);
    reduced = true;
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const errors: unknown[] = [];

    await act(async () => {
      hydrateRoot(container, <Probe />, { onRecoverableError: (e) => errors.push(e) });
    });

    expect(errors).toEqual([]);
    expect(container.querySelector("span")?.dataset.reduced).toBe("true");
  });

  it("keeps the server node instead of rebuilding the tree", async () => {
    reduced = null;
    const html = renderToString(<Probe />);
    reduced = true;
    const container = document.createElement("div");
    container.innerHTML = html;
    const serverNode = container.querySelector("span");

    await act(async () => {
      hydrateRoot(container, <Probe />);
    });

    expect(container.querySelector("span")).toBe(serverNode);
  });

  it("returns the real preference on a plain client render", async () => {
    const container = document.createElement("div");
    const { createRoot } = await import("react-dom/client");
    await act(async () => {
      createRoot(container).render(<Probe />);
    });
    expect(container.querySelector("span")?.dataset.reduced).toBe("true");
  });

  it("treats an unknown preference as motion allowed", async () => {
    reduced = null;
    const container = document.createElement("div");
    const { createRoot } = await import("react-dom/client");
    await act(async () => {
      createRoot(container).render(<Probe />);
    });
    expect(container.querySelector("span")?.dataset.reduced).toBe("false");
  });
});
