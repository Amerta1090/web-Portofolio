import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface IconProps {
  icon: LucideIcon;
  className?: string;
  size?: number;
  strokeWidth?: number;
  "aria-hidden"?: boolean | "true" | "false";
}

export function Icon({
  icon: LucideIcon,
  className,
  size = 16,
  strokeWidth = 2,
  ...props
}: IconProps) {
  return (
    <LucideIcon
      className={cn("shrink-0", className)}
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden={props["aria-hidden"] ?? true}
    />
  );
}
