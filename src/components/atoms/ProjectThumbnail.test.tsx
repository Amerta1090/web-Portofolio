import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProjectThumbnail from "./ProjectThumbnail";

/**
 * MOTION-01.5: the featured card thumbnails must ship responsive WebP variants
 * (`srcset`), a `sizes` value derived from measured card boxes, and explicit
 * intrinsic dimensions. The variant list is data, not a guess — a missing file
 * anywhere in it would silently degrade into a broken `srcset`, so the fallback
 * paths are tested as first-class behaviour rather than as an afterthought.
 */
const VARIANTS = [
  { src: "/images/projects/retro-game-portfolio-1152.webp", width: 1152 },
  { src: "/images/projects/retro-game-portfolio-384.webp", width: 384 },
  { src: "/images/projects/retro-game-portfolio-768.webp", width: 768 },
];

const SIZES = "(min-width: 1280px) 361px, (min-width: 768px) 341px, calc(100vw - 46px)";

describe("ProjectThumbnail (MOTION-01.5)", () => {
  it("renders every variant in ascending width order with the measured sizes", () => {
    render(
      <ProjectThumbnail
        src="/images/projects/retro-game-portfolio.png"
        variants={VARIANTS}
        alt="Retro"
      />,
    );
    const img = screen.getByRole("img", { name: "Retro" });
    // Sorted ascending so the browser's candidate order is deterministic even
    // though `data/projects.json` is authored by hand.
    expect(img.getAttribute("srcset")).toBe(
      "/images/projects/retro-game-portfolio-384.webp 384w, " +
        "/images/projects/retro-game-portfolio-768.webp 768w, " +
        "/images/projects/retro-game-portfolio-1152.webp 1152w",
    );
    expect(img).toHaveAttribute("sizes", SIZES);
    // The original file stays as the `src` fallback for browsers without WebP.
    expect(img).toHaveAttribute("src", "/images/projects/retro-game-portfolio.png");
  });

  it("declares the largest variant's 16:9 intrinsic size", () => {
    render(
      <ProjectThumbnail
        src="/images/projects/retro-game-portfolio.png"
        variants={VARIANTS}
        alt="Retro"
      />,
    );
    const img = screen.getByRole("img", { name: "Retro" });
    // 1152 × 9/16 = 648. Every generated variant is a 16:9 crop (ASSETS.md), so
    // the declared box matches the file and no layout shift is introduced.
    expect(img).toHaveAttribute("width", "1152");
    expect(img).toHaveAttribute("height", "648");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
  });

  it("never invents a resized thumbnail when no variants exist", () => {
    render(<ProjectThumbnail src="/images/projects/other.png" alt="Other" />);
    const img = screen.getByRole("img", { name: "Other" });
    // No variants: no `srcset`, no `sizes` (a `sizes` without candidates is
    // meaningless), and no invented intrinsic size for a file we did not measure.
    expect(img).not.toHaveAttribute("srcset");
    expect(img).not.toHaveAttribute("sizes");
    expect(img).toHaveAttribute("src", "/images/projects/other.png");
    expect(img).not.toHaveAttribute("width");
    expect(img).not.toHaveAttribute("height");
  });

  it("renders nothing when src is missing (MOTION-11: no placeholder art)", () => {
    const { container } = render(<ProjectThumbnail alt="Missing" />);
    // A project without owned evidence gets an intentional no-image layout,
    // not a generic illustration that claims a design that was never built.
    expect(screen.queryByRole("img", { name: "Missing" })).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it("removes the image when the file fails to load", () => {
    render(
      <ProjectThumbnail
        src="/images/projects/retro-game-portfolio.png"
        variants={VARIANTS}
        alt="Retro"
      />,
    );
    const img = screen.getByRole("img", { name: "Retro" });
    fireEvent.error(img);
    // A renamed file must degrade to the no-image card, not to a broken box.
    expect(screen.queryByRole("img", { name: "Retro" })).toBeNull();
  });
});
