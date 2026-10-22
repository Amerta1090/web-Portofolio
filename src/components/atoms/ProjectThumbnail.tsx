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
 * The fallback is an 800×600 SVG, so a source-less thumbnail can declare its own
 * intrinsic size instead of leaving the browser to guess before CSS lands. The
 * card box still crops it to 16:9 (`aspect-video` + `object-cover`).
 */
const PLACEHOLDER = {
  src: "/images/placeholder/project.svg",
  width: 800,
  height: 600,
} as const;

export default function ProjectThumbnail({
  src,
  variants = [],
  alt,
  className = "",
}: ProjectThumbnailProps) {
  const imageSrc = src || PLACEHOLDER.src;
  const ordered = src && variants.length > 0 ? [...variants].sort((a, b) => a.width - b.width) : [];
  const srcSet = ordered.map((variant) => `${variant.src} ${variant.width}w`).join(", ");
  // Every generated variant is a 16:9 crop of the source (recorded in
  // `docs/motion/ASSETS.md`), so the intrinsic height follows from the largest
  // width. Declaring it matches the box and removes layout shift entirely.
  const largest = ordered.at(-1);
  const width = largest?.width ?? (src ? undefined : PLACEHOLDER.width);
  const height = largest
    ? Math.round((largest.width * 9) / 16)
    : src
      ? undefined
      : PLACEHOLDER.height;

  return (
    <div
      className={`relative overflow-hidden aspect-video bg-surface-tertiary rounded-t-lg ${className}`}
    >
      <img
        src={imageSrc}
        srcSet={srcSet || undefined}
        sizes={srcSet ? CARD_SIZES : undefined}
        width={width}
        height={height}
        alt={alt}
        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        decoding="async"
        onError={(event) => {
          const image = event.currentTarget;
          // A stale variant must fall back as a unit; leaving `srcset` in place
          // lets the browser retry a broken candidate instead of the placeholder.
          image.srcset = "";
          image.src = PLACEHOLDER.src;
        }}
      />
      {!src && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-text-secondary/40">{/* ASSET NEEDED */}</span>
        </div>
      )}
    </div>
  );
}
