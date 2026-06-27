import { Menu } from "lucide-react";
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
        <Menu size={18} />
      </button>
      <GameMenuEngine isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
