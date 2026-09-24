import * as React from "react";
import { cn } from "../../lib/utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Render the label visually hidden (still exposed to assistive tech). */
  srOnly?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, srOnly = false, ...props }, ref) => (
    // biome-ignore lint/a11y/noLabelWithoutControl: reusable label primitive — htmlFor/association comes from consumer props
    <label
      ref={ref}
      className={cn("block text-sm font-medium text-text-primary", srOnly && "sr-only", className)}
      {...props}
    />
  ),
);
Label.displayName = "Label";

export { Label };
