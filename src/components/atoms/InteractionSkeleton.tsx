import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";
import { duration, stagger as staggerTokens } from "../../lib/motion";

/* ── Variants ── */

type SkeletonVariant = "text" | "circular" | "rectangular" | "card" | "avatar";

const variantClass: Record<SkeletonVariant, string> = {
  text: "h-4 w-full rounded",
  circular: "h-10 w-10 rounded-full",
  rectangular: "h-24 w-full rounded-lg",
  card: "h-40 w-full rounded-lg",
  avatar: "h-12 w-12 rounded-full",
};

const shimmerClass =
  "relative overflow-hidden bg-surface-tertiary skeleton-shimmer";

const reducedClass = "bg-surface-tertiary rounded";

/* ── Props ── */

export interface InteractionSkeletonProps {
  /** Visual variant */
  variant?: SkeletonVariant;
  /** Width override */
  width?: string | number;
  /** Height override */
  height?: string | number;
  /** Number of items to render */
  count?: number;
  /** Direction for multiple items */
  direction?: "row" | "column";
  /** Gap between items */
  gap?: number;
  /** Stagger delay between items */
  stagger?: number;
  /** Disable shimmer */
  noShimmer?: boolean;
  /** Additional class names */
  className?: string;
  /** Role for accessibility */
  role?: string;
  /** aria-label */
  "aria-label"?: string;
}

/* ── Skeleton Block ── */

function SkeletonBlock({
  variant = "text",
  width,
  height,
  noShimmer,
  className,
}: Omit<InteractionSkeletonProps, "count" | "direction" | "gap" | "stagger">) {
  const prefersReduced = useReducedMotion();
  const showShimmer = !prefersReduced && !noShimmer;

  return (
    <div
      aria-hidden="true"
      className={cn(
        showShimmer ? shimmerClass : reducedClass,
        variantClass[variant],
        className,
      )}
      style={{
        width: width ?? (variant === "circular" || variant === "avatar" ? undefined : undefined),
        height: height ?? undefined,
      }}
    />
  );
}

/* ── Main ── */

export function InteractionSkeleton({
  variant = "text",
  width,
  height,
  count = 1,
  direction = "column",
  gap = 12,
  stagger,
  noShimmer,
  className,
  ...props
}: InteractionSkeletonProps) {
  const prefersReduced = useReducedMotion();
  const staggerDelay = stagger ?? staggerTokens.quick;

  if (count <= 1) {
    return (
      <SkeletonBlock
        variant={variant}
        width={width}
        height={height}
        noShimmer={noShimmer}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex",
        direction === "row" ? "flex-row" : "flex-col",
        className,
      )}
      style={{ gap }}
      role="status"
      aria-label="Loading"
      {...props}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
          animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          transition={
            prefersReduced
              ? undefined
              : { duration: duration.normal, delay: i * staggerDelay }
          }
        >
          <SkeletonBlock
            variant={variant}
            width={width}
            height={height}
            noShimmer={noShimmer}
          />
        </motion.div>
      ))}
    </div>
  );
}

/* ── Compound sub-components ── */

InteractionSkeleton.Text = function SkeletonText({
  lines = 3,
  width,
  className,
}: { lines?: number; width?: string | number; className?: string }) {
  const prefersReduced = useReducedMotion();

  return (
    <div className={cn("flex flex-col gap-2", className)} role="status" aria-label="Loading text">
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
          animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          transition={
            prefersReduced
              ? undefined
              : { duration: duration.fast, delay: i * 0.04 }
          }
        >
          <SkeletonBlock variant="text" width={width ?? (i === lines - 1 ? "60%" : "100%")} />
        </motion.div>
      ))}
    </div>
  );
};

InteractionSkeleton.Card = function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border p-6", className)} role="status" aria-label="Loading card">
      <SkeletonBlock variant="rectangular" className="mb-4" />
      <SkeletonBlock variant="text" width="70%" className="mb-2" />
      <SkeletonBlock variant="text" width="90%" />
    </div>
  );
};

InteractionSkeleton.Avatar = function SkeletonAvatar({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} role="status" aria-label="Loading avatar">
      <SkeletonBlock variant="avatar" />
      <div className="flex flex-col gap-2 flex-1">
        <SkeletonBlock variant="text" width="40%" />
        <SkeletonBlock variant="text" width="60%" />
      </div>
    </div>
  );
};
