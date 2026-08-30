import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_STORAGE, HISTORY_STORAGE, SESSION_EVENT } from "../../lib/recommend/session";
import type { Recommendable } from "../../lib/recommend/useRecommendation";
import { RecommendedRow } from "./RecommendedRow";

const LAB: Recommendable[] = [
  { id: "audio", title: "Audio Visualizer", tags: ["audio", "fft", "web-audio"] },
  { id: "fluid", title: "Liquid Distortion", tags: ["canvas", "fluid", "solver"] },
  { id: "fractal", title: "Fractal Explorer", tags: ["fractal", "canvas", "glsl"] },
];

describe("RecommendedRow session reactivity", () => {
  beforeEach(() => localStorage.clear());

  it("updates the current label when the session emits a change", () => {
    render(<RecommendedRow items={LAB} current={LAB[1]} />);
    act(() => {
      localStorage.setItem(HISTORY_STORAGE, JSON.stringify({ canvas: 3 }));
      localStorage.setItem(CURRENT_STORAGE, "audio");
      window.dispatchEvent(new CustomEvent(SESSION_EVENT));
    });
    expect(screen.getByText(/Karena kamu jelajahi/)?.closest("section")).toHaveTextContent(
      /Audio Visualizer/,
    );
  });
});
