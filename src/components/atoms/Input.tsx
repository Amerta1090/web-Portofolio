import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../lib/utils";

const inputVariants = cva(
  "flex w-full rounded-lg border bg-bg-secondary text-sm text-text-primary placeholder:text-text-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/40",
  {
    variants: {
      variant: {
        default: "border-border",
        ghost: "border-transparent bg-transparent",
      },
      size: {
        md: "px-4 py-2.5",
        lg: "px-5 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /** Convenience flag — sets `aria-invalid` so styles follow the a11y attribute. */
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, error, ...props }, ref) => {
    const invalid = error || props["aria-invalid"] === true || props["aria-invalid"] === "true";
    return (
      <input
        ref={ref}
        className={cn(inputVariants({ variant, size, className }))}
        aria-invalid={invalid ? "true" : undefined}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };
