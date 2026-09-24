import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../lib/utils";

const textareaVariants = cva(
  "flex w-full min-h-[88px] rounded-lg border bg-bg-secondary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary transition-colors resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/40",
  {
    variants: {
      variant: {
        default: "border-border",
        ghost: "border-transparent bg-transparent",
      },
      size: {
        md: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  /** Convenience flag — sets `aria-invalid` so styles follow the a11y attribute. */
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, size, error, ...props }, ref) => {
    const invalid = error || props["aria-invalid"] === true || props["aria-invalid"] === "true";
    return (
      <textarea
        ref={ref}
        className={cn(textareaVariants({ variant, size, className }))}
        aria-invalid={invalid ? "true" : undefined}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
