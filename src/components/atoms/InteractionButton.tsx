import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Loader2, X } from "lucide-react";
import { type ButtonHTMLAttributes, type ReactNode, useCallback, useState } from "react";
import { cn } from "../../lib/utils";
import { duration, easing } from "../../lib/motion";

type AsyncState = "idle" | "loading" | "success" | "error";

export interface InteractionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: "primary" | "secondary" | "ghost" | "outline" | "link";
  /** Size */
  size?: "sm" | "md" | "lg" | "xl";
  /** Duration (ms) before auto-resetting from success/error to idle. Set 0 to persist. */
  feedbackDuration?: number;
  /** Custom content for each non-idle state */
  feedback?: Partial<Record<AsyncState, ReactNode>>;
  /** Async click handler — resolve true/false or throw for error */
  onClick?: () => Promise<boolean | void> | boolean | void;
  /** Called when state changes */
  onStateChange?: (state: AsyncState) => void;
}

const variantStyles: Record<string, string> = {
  primary: "bg-brand text-white hover:bg-brand/90 active:bg-brand/80",
  secondary: "bg-surface-secondary text-text-primary hover:bg-surface-tertiary border border-border",
  ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-secondary",
  outline: "border border-border bg-transparent hover:bg-surface-secondary hover:text-text-primary",
  link: "text-brand underline-offset-4 hover:underline",
};

const sizeStyles: Record<string, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-10 px-4 py-2 text-sm",
  lg: "h-11 px-6 text-base",
  xl: "h-12 px-8 text-lg",
};

const stateIcons: Record<AsyncState, ReactNode> = {
  idle: null,
  loading: <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />,
  success: <Check className="h-4 w-4" aria-hidden="true" />,
  error: <X className="h-4 w-4" aria-hidden="true" />,
};

const stateLabels: Record<AsyncState, string> = {
  idle: "",
  loading: "Loading",
  success: "Done",
  error: "Failed",
};

export function InteractionButton({
  children,
  variant = "primary",
  size = "md",
  feedbackDuration = 2000,
  feedback,
  onClick,
  onStateChange,
  disabled,
  className,
  ...props
}: InteractionButtonProps) {
  const [state, setState] = useState<AsyncState>("idle");
  const prefersReduced = useReducedMotion();

  const setStateWithCallback = useCallback(
    (next: AsyncState) => {
      setState(next);
      onStateChange?.(next);
    },
    [onStateChange],
  );

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (state !== "idle" || !onClick) return;
      e.preventDefault();

      setStateWithCallback("loading");
      try {
        const result = await onClick();
        const next = result !== false ? "success" : "error";
        setStateWithCallback(next);
        if (feedbackDuration > 0) {
          setTimeout(() => setStateWithCallback("idle"), feedbackDuration);
        }
      } catch {
        setStateWithCallback("error");
        if (feedbackDuration > 0) {
          setTimeout(() => setStateWithCallback("idle"), feedbackDuration);
        }
      }
    },
    [state, onClick, feedbackDuration, setStateWithCallback],
  );

  if (prefersReduced) {
    const reducedIcon = stateIcons[state];
    const reducedFeedback = feedback?.[state];
    return (
      <button
        type="button"
        disabled={disabled || state === "loading"}
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium ring-offset-bg-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {reducedFeedback ?? reducedIcon}
        {reducedFeedback ? null : state === "idle" ? children : stateLabels[state]}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled || state === "loading"}
      onClick={handleClick}
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-md font-medium ring-offset-bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      <AnimatePresence mode="popLayout">
        {state === "loading" && (
          <motion.span
            key="loading"
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: duration.fast, ease: easing["ease-out-expo"] }}
            className="inline-flex items-center gap-2"
          >
            {feedback?.loading ?? (
              <>
                {stateIcons.loading}
                <span>Loading</span>
              </>
            )}
          </motion.span>
        )}

        {state === "success" && (
          <motion.span
            key="success"
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: duration.fast, ease: easing["ease-out-back"] }}
            className="inline-flex items-center gap-2 text-green-500"
          >
            {feedback?.success ?? (
              <>
                {stateIcons.success}
                <span>Done</span>
              </>
            )}
          </motion.span>
        )}

        {state === "error" && (
          <motion.span
            key="error"
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: [0, -4, 4, -4, 4, -2, 2, 0],
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              duration: duration.slow,
              ease: easing["ease-out-expo"],
              x: { duration: 0.4 },
            }}
            className="inline-flex items-center gap-2 text-red-500"
          >
            {feedback?.error ?? (
              <>
                {stateIcons.error}
                <span>Failed</span>
              </>
            )}
          </motion.span>
        )}

        {state === "idle" && (
          <motion.span
            key="idle"
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.fast }}
            className="inline-flex items-center gap-2"
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
