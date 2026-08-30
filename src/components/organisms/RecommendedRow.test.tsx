import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecommendedRow } from "./RecommendedRow";
import type { Recommendable } from "../../lib/recommend/useRecommendation";

const STORAGE_KEY = "detAIministic:recommend:v1";

const LAB: Recommendable[] = [
  { id: "fluid", title: "Liquid Distortion", tags: ["canvas", "fluid", "solver"] },
  { id: "fractal", title: "Fractal Explorer", tags: ["fractal", "canvas", "glsl"] },
  { id: "audio", title: "Audio Visualizer", tags: ["audio", "fft", "web-audio"] },
  { id: "ml-clock", title: "Neural Clock", tags: ["ml", "neural-net", "backprop"] },
  { id: "snake", title: "Snake RL", tags: ["game", "ml", "reinforcement"] },
];

const CURRENT: Recommendable = {
  id: "fluid",
  title: "Liquid Distortion",
  tags: ["canvas", "fluid", "solver"],
};

const seedHistory = (map: Record<string, number>) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));

describe("RecommendedRow", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("renders nothing when the visitor has not interacted", () => {
    const { container } = render(<RecommendedRow items={LAB} current={CURRENT} />);
    expect(container.firstChild).toBeNull();
    expect(container.querySelectorAll("[data-testid='recommendation-card']")).toHaveLength(0);
  });

  it("renders the strip plus up to the default 3 cards once history exists", () => {
    seedHistory({ audio: 6, fft: 6, "web-audio": 6 });
    render(<RecommendedRow items={LAB} current={CURRENT} />);
    expect(
      screen.getByText(/Karena kamu jelajahi/, { selector: "p" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Liquid Distortion", { selector: "span" })).toBeInTheDocument();
    const cards = screen.getAllByTestId("recommendation-card");
    expect(cards).toHaveLength(3);
    expect(cards[0]).toHaveTextContent("Audio Visualizer");
  });

  it("honors the limit prop", () => {
    seedHistory({ audio: 6, fft: 6, "web-audio": 6 });
    render(<RecommendedRow items={LAB} current={CURRENT} limit={2} />);
    expect(screen.getAllByTestId("recommendation-card")).toHaveLength(2);
  });

  it("shows a similarity percentage with tabular numerals", () => {
    seedHistory({ audio: 6, fft: 6, "web-audio": 6 });
    render(<RecommendedRow items={LAB} current={CURRENT} />);
    expect(screen.getAllByTestId("recommendation-card")[0]).toHaveTextContent(/kemiripan \d+%/);
  });

  it("shows tag chips on each card", () => {
    seedHistory({ audio: 6, fft: 6, "web-audio": 6 });
    render(<RecommendedRow items={LAB} current={CURRENT} />);
    const first = screen.getAllByTestId("recommendation-card")[0];
    for (const tag of ["audio", "fft", "web-audio"]) {
      expect(first).toHaveTextContent(tag);
    }
  });

  it("calls onOpen and accumulates clicks into persisted history", async () => {
    const user = userEvent.setup();
    seedHistory({ audio: 6, fft: 6, "web-audio": 6 });
    const onOpen = vi.fn();
    render(<RecommendedRow items={LAB} current={CURRENT} onOpen={onOpen} />);

    const firstCard = screen.getAllByTestId("recommendation-card")[0];
    await user.click(firstCard);

    expect(onOpen).toHaveBeenCalledWith("audio");
    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(persisted.audio).toBeGreaterThan(6);
  });

  it("shows nothing when all candidates score zero", () => {
    seedHistory({ planet: 9, gravity: 9, "n-body": 9 });
    const exotic: Recommendable = {
      id: "hyperboloid",
      title: "Hyperboloid Tower",
      tags: ["hyperbolic-geometry"],
    };
    const { container } = render(<RecommendedRow items={LAB} current={exotic} />);
    const cards = container.querySelectorAll("[data-testid='recommendation-card']");
    expect(cards).toHaveLength(0);
  });
});