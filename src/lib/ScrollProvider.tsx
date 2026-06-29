import { createContext, useContext, type ReactNode } from "react";
import { useScrollProgress, type ScrollProgressData } from "./useScrollProgress";

const ScrollContext = createContext<ScrollProgressData | null>(null);

export function ScrollProvider({ children }: { children: ReactNode }) {
  const scrollData = useScrollProgress();

  return <ScrollContext.Provider value={scrollData}>{children}</ScrollContext.Provider>;
}

export function useScroll(): ScrollProgressData {
  const ctx = useContext(ScrollContext);
  if (!ctx) {
    throw new Error("useScroll must be used within a <ScrollProvider>");
  }
  return ctx;
}
