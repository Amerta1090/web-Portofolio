import { useCallback, useEffect, useRef, useState } from "react";

let sharedCtx: AudioContext | null = null;
let sharedOsc: OscillatorNode | null = null;
let sharedGain: GainNode | null = null;

const getAudioContext = (): AudioContext | null => {
  if (sharedCtx) return sharedCtx;
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    sharedCtx = new AC();
    sharedOsc = sharedCtx.createOscillator();
    sharedGain = sharedCtx.createGain();
    sharedOsc.connect(sharedGain);
    sharedGain.connect(sharedCtx.destination);
    sharedOsc.start();
    sharedGain.gain.value = 0;
    return sharedCtx;
  } catch {
    return null;
  }
};

const ensureResumed = async (): Promise<boolean> => {
  const ctx = getAudioContext();
  if (!ctx) return false;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }
  return ctx.state === "running";
};

const playTone = (
  type: OscillatorType,
  startFreq: number,
  endFreq: number,
  duration: number,
  volume: number,
) => {
  const ctx = getAudioContext();
  if (!ctx || !sharedOsc || !sharedGain) return;

  const now = ctx.currentTime;
  sharedOsc.type = type;
  sharedOsc.frequency.setValueAtTime(startFreq, now);
  sharedOsc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

  sharedGain.gain.setValueAtTime(0, now);
  sharedGain.gain.linearRampToValueAtTime(volume, now + 0.01);
  sharedGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
};

const getMuted = (): boolean => {
  try {
    return localStorage.getItem("haptics-muted") === "true";
  } catch {
    return false;
  }
};

const setMutedStorage = (muted: boolean) => {
  try {
    localStorage.setItem("haptics-muted", muted ? "true" : "false");
  } catch {
    // Ignore
  }
};

export const useHaptics = () => {
  const [isMuted, setIsMuted] = useState(getMuted);
  const resumeAttempted = useRef(false);

  useEffect(() => {
    if (!resumeAttempted.current && !isMuted) {
      resumeAttempted.current = true;
      ensureResumed();
    }
  }, [isMuted]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && !isMuted) {
        ensureResumed();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isMuted]);

  const playHoverSound = useCallback(() => {
    if (isMuted) return;
    ensureResumed().then((ok) => {
      if (ok) playTone("sine", 800, 1200, 0.05, 0.05);
    });
  }, [isMuted]);

  const playSelectSound = useCallback(() => {
    if (isMuted) return;
    ensureResumed().then((ok) => {
      if (ok) playTone("square", 150, 50, 0.1, 0.1);
    });
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      setMutedStorage(next);
      return next;
    });
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
    setMutedStorage(muted);
  }, []);

  return { playHoverSound, playSelectSound, isMuted, toggleMute, setMuted };
};
