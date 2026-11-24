import { Menu } from "lucide-react";
import React from "react";
import { GameMenuEngine } from "./GameMenuEngine";

export const GameMenuWrapper: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/*
        Desktop only (MOTION-12). On a phone the header already carries the
        canonical navigation trigger (`Header.astro`, `data-mobile-nav-trigger`,
        aria-label "Menu"), and this second burger sat ~90px to its right with a
        different name: two menu buttons for one job, which a reader reads as a
        duplicate or a bug. The sheet it opens is a playful alternate route, not
        the only way to navigate, so the narrow viewport keeps exactly one.
        `hidden lg:flex` matches the header's own breakpoint for the desktop nav.
      */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative hidden lg:flex items-center justify-center w-10 h-10 bg-bg-tertiary text-text-secondary hover:text-brand transition-colors border border-border rounded-lg"
        aria-label="Open Menu"
      >
        <Menu size={18} />
      </button>
      <GameMenuEngine isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
