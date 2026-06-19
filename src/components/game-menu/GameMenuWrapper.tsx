import React from "react";
import { GameMenuEngine } from "./GameMenuEngine";
import { useHaptics } from "../../lib/useHaptics";

export const GameMenuWrapper: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { playSelectSound } = useHaptics();

  return (
    <>
      <button
        onClick={() => {
          playSelectSound();
          setIsOpen(true);
        }}
        className="relative flex items-center justify-center w-10 h-10 bg-bg-tertiary text-text-secondary hover:text-accent hover:border-accent transition-all duration-300 border border-accent/20 pulse-ring"
        aria-label="Open Game Menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M6 12h12" />
          <path d="M10 9v6" />
          <path d="M14 9v6" />
        </svg>
      </button>
      <GameMenuEngine isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
