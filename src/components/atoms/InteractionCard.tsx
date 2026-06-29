import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";
import { cn } from "../../lib/utils";
import { duration, easing } from "../../lib/motion";

export interface InteractionCardProps {
  /** Visual variant */
  variant?: "default" | "elevated" | "outlined";
  /** Hover lift distance in px. 0 to disable lift */
  lift?: number;
  /** Press scale. 1 to disable press effect */
  pressScale?: number;
  /** Show border glow on hover */
  glow?: boolean;
  /** Glow color (Tailwind ring color class) */
  glowColor?: string;
  /** Make the whole card clickable with this href */
  href?: string;
  /** Optional icon/avatar at top */
  icon?: ReactNode;
  /** Card heading */
  heading?: ReactNode;
  /** Card description */
  description?: ReactNode;
  /** Card footer content */
  footer?: ReactNode;
  /** Children rendered between description and footer */
  children?: ReactNode;
  /** Additional class names */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

const variantStyles: Record<string, string> = {
  default: "border border-border bg-surface-primary",
  elevated: "border border-border bg-surface-primary shadow-sm",
  outlined: "border-2 border-border bg-transparent",
};

export function InteractionCard({
  children,
  variant = "default",
  lift = 4,
  pressScale = 0.98,
  glow = true,
  glowColor = "ring-brand/30",
  href,
  icon,
  heading,
  description,
  footer,
  className,
  onClick,
}: InteractionCardProps) {
  const prefersReduced = useReducedMotion();

  const content = (
    <>
      {icon && <div className="mb-4">{icon}</div>}
      {heading && <h3 className="text-lg font-semibold leading-none tracking-tight">{heading}</h3>}
      {description && (
        <p className="mt-2 text-sm text-text-secondary">{description}</p>
      )}
      {children}
      {footer && <div className="mt-4 pt-4 border-t border-border">{footer}</div>}
    </>
  );

  if (prefersReduced) {
    const Tag = href ? "a" : "div";
    return (
      <Tag
        href={href}
        onClick={onClick}
        className={cn(
          "rounded-lg p-6 transition-colors",
          variantStyles[variant],
          (href || onClick) && "cursor-pointer hover:bg-surface-secondary",
          className,
        )}
      >
        {content}
      </Tag>
    );
  }

  const hoverLift = lift > 0 ? -lift : 0;
  const Tag = href ? motion.a : motion.div;

  return (
    <Tag
      href={href}
      onClick={onClick}
      className={cn(
        "relative rounded-lg overflow-hidden p-6",
        variantStyles[variant],
        glow && "ring-1 ring-transparent focus-visible:ring-2 focus-visible:ring-brand",
        (href || onClick) && "cursor-pointer",
        className,
      )}
      initial={{ y: 0, scale: 1 }}
      whileHover={{
        y: hoverLift,
        scale: pressScale < 1 ? pressScale : 1,
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
        transition: { duration: duration.normal, ease: easing["ease-out-expo"] },
      }}
      whileTap={pressScale < 1 ? { scale: pressScale - 0.02 } : undefined}
    >
      {glow && (
        <motion.div
          className={cn(
            "pointer-events-none absolute inset-0 rounded-lg opacity-0",
            glowColor,
          )}
          initial={{ opacity: 0 }}
          whileHover={{
            opacity: 1,
            boxShadow: "inset 0 0 0 1px var(--color-brand)",
            transition: { duration: duration.normal },
          }}
          aria-hidden="true"
        />
      )}

      <div className="relative z-10">{content}</div>
    </Tag>
  );
}
