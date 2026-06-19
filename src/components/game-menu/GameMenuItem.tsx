import React from "react";
import { motion, Variants } from "framer-motion";
import { MenuCursor } from "./MenuCursor";

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
  hidden: { opacity: 0, x: -50, skewX: -10, scale: 0.9 },
  visible: { 
    opacity: 1, 
    x: 0, 
    skewX: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  },
  hover: {
    scale: 1.05,
    x: 15,
    skewX: -5,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  },
  tap: {
    scale: 0.95,
    filter: "brightness(1.5)",
    transition: { duration: 0.1 }
  }
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
      className="relative mb-4 last:mb-0 cursor-pointer"
      variants={menuItemVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      onHoverStart={() => onHover(index)}
      onClick={() => onClick(href)}
    >
      {isActive && <MenuCursor />}
      
      <div 
        className={`flex items-center px-4 py-3 border-2 transition-colors duration-200 ${
          isActive ? "border-accent text-accent glitch-hover pulse-glow" : "border-border text-text-primary"
        }`}
        data-text={label}
        style={{ transform: "skewX(-10deg)" }}
      >
        <div className="flex-1 flex items-center gap-4" style={{ transform: "skewX(10deg)" }}>
          {icon && <span className="text-xl">{icon}</span>}
          <span className="text-2xl font-bold uppercase tracking-wider font-mono">
            {label}
          </span>
        </div>
        
        {shortcut && (
          <div style={{ transform: "skewX(10deg)" }}>
            <span className="text-xs font-mono font-bold bg-bg-tertiary px-2 py-1 border border-border">
              {shortcut}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
