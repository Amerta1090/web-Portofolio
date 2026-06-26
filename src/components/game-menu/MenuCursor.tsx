import { motion } from "framer-motion";
import type React from "react";

export const MenuCursor: React.FC = () => {
  return (
    <motion.div
      layoutId="activeMenuCursor"
      className="absolute inset-0 bg-accent -z-10 mix-blend-screen rounded-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.8 }}
      exit={{ opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        mass: 0.5,
      }}
    />
  );
};
