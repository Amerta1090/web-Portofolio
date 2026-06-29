import { useEffect, useRef } from "react";
import { useTimeOfDay } from "../lib/useTimeOfDay";

export default function TimeAwareTheme() {
  const { warmth } = useTimeOfDay();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (appliedRef.current) return;
    appliedRef.current = true;

    const root = document.documentElement;
    const warmValue = Math.round(warmth * 255);

    root.style.setProperty(
      "--color-brand-warm-rgb",
      `${warmValue} ${Math.round(warmValue * 0.7)} ${Math.round(warmValue * 0.4)}`,
    );
  }, [warmth]);

  return null;
}
