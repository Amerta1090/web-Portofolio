import { motion } from "framer-motion";
import type React from "react";
import { useEffect, useState } from "react";
import { useHaptics } from "../../lib/useHaptics";

export const GameModeToggle: React.FC = () => {
  const [isGameMode, setIsGameMode] = useState(false);
  const { playHoverSound, playSelectSound } = useHaptics();

  useEffect(() => {
    const savedMode = localStorage.getItem("game-mode");
    if (savedMode === "true") {
      setIsGameMode(true);
      document.documentElement.classList.add("game-mode");
      document.body.classList.add("crt-overlay", "vignette-overlay");
    }
  }, []);

  const toggleGameMode = () => {
    playSelectSound();
    const newMode = !isGameMode;
    setIsGameMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("game-mode");
      document.body.classList.add("crt-overlay", "vignette-overlay");
      localStorage.setItem("game-mode", "true");
    } else {
      document.documentElement.classList.remove("game-mode");
      document.body.classList.remove("crt-overlay", "vignette-overlay");
      localStorage.setItem("game-mode", "false");
    }
  };

  return (
    <button
      onClick={toggleGameMode}
      onMouseEnter={playHoverSound}
      className={`relative flex items-center justify-center w-10 h-10 border transition-all duration-300 ${
        isGameMode
          ? "bg-accent text-bg-primary border-accent shadow-[0_0_12px_var(--accent-glow)]"
          : "bg-bg-tertiary text-text-secondary hover:text-accent border-accent/20 hover:border-accent/40"
      }`}
      aria-label="Toggle Game Mode"
      title="Toggle Game Mode"
    >
      <motion.div
        initial={false}
        animate={{ rotate: isGameMode ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
      >
        {isGameMode ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M6 12h12" />
            <path d="M10 9v6" />
            <path d="M14 9v6" />
          </svg>
        )}
      </motion.div>
    </button>
  );
};
