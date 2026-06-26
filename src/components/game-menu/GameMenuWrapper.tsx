import React from "react";
import { GameMenuEngine } from "./GameMenuEngine";

export const GameMenuWrapper: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center justify-center w-10 h-10 bg-bg-tertiary text-text-secondary hover:text-brand transition-colors border border-border rounded-lg"
        aria-label="Open Menu"
      >
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
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <GameMenuEngine isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
