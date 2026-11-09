import { useEffect, useRef, useState } from "react";
import type { ProjectImageVariant } from "../../types/projects";

interface ProjectThumbnailProps {
  src?: string;
  variants?: ProjectImageVariant[];
  alt: string;
  className?: string;
}

/**
 * The card box is 16:9 at every breakpoint. The measured image width is 361 px
 * at the widest three-column layout, 341 px in the two-column tablet layout,
 * and `100vw - 46px` on phones. The 384/768/1152 variants cover 1x/2x/3x for the
 * widest card; 341 px still selects the same files, so the simpler expression
 * does not cost extra bytes. Variants are passed in from the data layer rather
 * than guessed here — a missing file must never become a broken `srcset`.
 */
const CARD_SIZES = "(min-width: 1280px) 361px, (min-width: 768px) 341px, calc(100vw - 46px)";

/**
 * MOTION-11: a project without owned evidence renders no image at all.
 *
 * There is deliberately no placeholder art. A generic "project" illustration
 * presents a design that was never built, which is a claim the data layer
 * cannot back. `ProjectCardGrid` gives the title room to breathe instead
 * (`data-project-no-image`).
 *
 * A missing or failed file also resolves to `null`: a card whose file was
 * renamed must look like a card without an image, not like a request for an
 * asset that was never captured.
 */
export default function ProjectThumbnail({
  src,
  variants = [],
  alt,
  className = "",
}: ProjectThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // `onError` only fires for loads that fail after hydration. A cached failure
  // can be settled before React attaches, so check once on mount as well.
  // `currentSrc` is empty in jsdom (and for a source-less image), which keeps
  // the check from firing where no request was ever made.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0 && img.currentSrc) {
      setFailed(true);
    }
  }, []);

  if (!src || failed) return null;

  const ordered = variants.length > 0 ? [...variants].sort((a, b) => a.width - b.width) : [];
  const srcSet = ordered.map((variant) => `${variant.src} ${variant.width}w`).join(", ");
  // Every generated variant is a 16:9 crop of the source (recorded in
  // `docs/motion/ASSETS.md`), so the intrinsic height follows from the largest
  // width. Declaring it matches the box and removes layout shift entirely.
  const largest = ordered.at(-1);
  const width = largest?.width;
  const height = largest ? Math.round((largest.width * 9) / 16) : undefined;

  return (
    <div
      className={`relative overflow-hidden aspect-video bg-surface-tertiary rounded-t-lg ${className}`}
    >
      <img
        ref={imgRef}
        src={src}
        srcSet={srcSet || undefined}
        sizes={srcSet ? CARD_SIZES : undefined}
        width={width}
        height={height}
        alt={alt}
        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
