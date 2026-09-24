import * as React from "react";
import { cn } from "../../lib/utils";
import { Label } from "./Label";

export interface FormFieldProps {
  /** Stable id linked to the control via `htmlFor` and to error/hint via `aria-describedby`. */
  id: string;
  /** Optional label text. Omit (or pass `undefined`) to render no label. */
  label?: string;
  /** Render the label visually hidden. */
  srOnly?: boolean;
  /** Error message — rendered in an `role="alert"` node id'd `${id}-error`. */
  error?: string;
  /** Helper text — rendered when no error message is present. */
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ id, label, srOnly, error, hint, className, children }, ref) => {
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    return (
      <div ref={ref} className={cn("space-y-1", className)}>
        {label !== undefined && (
          <Label htmlFor={id} srOnly={srOnly}>
            {label}
          </Label>
        )}
        {children}
        {hint && !error && (
          <p id={hintId} className="text-sm text-text-secondary">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
FormField.displayName = "FormField";

export { FormField };
