import { type Variants, motion } from "framer-motion";
import type React from "react";
import { duration, easing, distance } from "../../lib/motion";

interface GameMenuItemProps {
  label: string;
  href: string;
  index: number;
  isActive: boolean;
  onHover: (index: number) => void;
  onClick: (href: string) => void;
  shortcut?: string;
  icon?: React.ReactNode;
}

const menuItemVariants: Variants = {
  hidden: { opacity: 0, x: -distance.significant, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: easing["ease-spring-gentle"],
  },
  hover: {
    scale: 1.02,
    x: distance.subtle,
    transition: easing["ease-spring-snappy"],
  },
  tap: {
    scale: 0.97,
    transition: { duration: duration.instant },
  },
};

export const GameMenuItem: React.FC<GameMenuItemProps> = ({
  label,
  href,
  index,
  isActive,
  onHover,
  onClick,
  shortcut,
  icon,
}) => {
  return (
    <motion.div
      className="relative mb-2 last:mb-0 cursor-pointer"
      variants={menuItemVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      onHoverStart={() => onHover(index)}
      onClick={() => onClick(href)}
    >
      <div
        className={`flex items-center px-4 py-3 rounded-lg border transition-colors duration-200 ${
          isActive
            ? "border-brand bg-brand/10 text-brand"
            : "border-border text-text-primary hover:border-brand/30"
        }`}
      >
        <div className="flex-1 flex items-center gap-3">
          {icon && <span className="text-lg">{icon}</span>}
          <span className="text-base font-medium text-text-primary">{label}</span>
        </div>

        {shortcut && (
          <span className="text-xs text-text-secondary/40 bg-bg-tertiary px-2 py-0.5 rounded">
            {shortcut}
          </span>
        )}
      </div>
    </motion.div>
  );
};
