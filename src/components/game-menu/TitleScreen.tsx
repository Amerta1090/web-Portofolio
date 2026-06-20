import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TitleScreenProps {
  showBoot: boolean;
  onBootComplete: () => void;
  onStart: () => void;
}

const BootSequence: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [showGlitch, setShowGlitch] = useState(true);
  const [glitchText, setGlitchText] = useState("");

  useEffect(() => {
    const steps = [
      { at: 0.1, text: "INITIALIZING SYSTEM..." },
      { at: 0.25, text: "LOADING KERNEL MODULES..." },
      { at: 0.4, text: "MOUNTING DATA STREAMS..." },
      { at: 0.55, text: "ESTABLISHING SECURE CHANNEL..." },
      { at: 0.7, text: "SYNCING PORTFOLIO DATABASE..." },
      { at: 0.85, text: "ARMING VISUAL INTERFACE..." },
    ];

    const startTime = Date.now();
    const duration = 800;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(elapsed / duration, 1);
      setProgress(pct);

      const currentStep = [...steps].reverse().find((s) => pct >= s.at);
      if (currentStep) setGlitchText(currentStep.text);

      if (pct >= 1) {
        clearInterval(interval);
        setShowGlitch(false);
        setTimeout(onComplete, 200);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {showGlitch && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative mb-8">
            <motion.h1
              className="text-8xl font-black tracking-[0.3em] text-white"
              initial={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.4 }}
            >
              <motion.span
                animate={{
                  x: [0, -3, 2, -1, 0],
                  opacity: [1, 0.8, 0.9, 1],
                }}
                transition={{ duration: 0.15, repeat: 6, repeatType: "mirror" }}
                style={{ display: "inline-block" }}
              >
                AMERTA
              </motion.span>
            </motion.h1>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
                mixBlendMode: "overlay",
              }}
            />
          </div>

          <div className="w-80 max-w-[80vw]">
            <div className="h-1 bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-white"
                style={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>
            <motion.p
              className="text-xs font-mono text-white/60 mt-3 tracking-widest"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {glitchText}
            </motion.p>
          </div>

          <div className="absolute bottom-8 text-[10px] font-mono text-white/20 tracking-wider">
            v{APP_VERSION} // BUILD {BUILD_DATE}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const APP_VERSION = "2.0.0";
const BUILD_DATE = "2026.06";

const TitleScreenComponent: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const [blink, setBlink] = useState(true);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => setBlink((b) => !b), 530);
    const hintTimeout = setTimeout(() => setShowHint(true), 400);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      clearInterval(blinkInterval);
      clearTimeout(hintTimeout);
      window.removeEventListener("keydown", handleKey);
    };
  }, [onStart]);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-black z-40 cursor-pointer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      onClick={onStart}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(230,0,18,0.05) 0%, transparent 70%)",
        }}
      />

      <motion.div
        className="text-center mb-16"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <div className="text-xs font-mono text-accent tracking-[0.3em] mb-4">
          ABDUL MAJID RIDWAN TYASTONOATMAJA
        </div>
        <h1 className="text-7xl md:text-9xl font-black tracking-[0.15em] text-white leading-none">
          <span className="text-accent">A</span>MERTA
        </h1>
        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent w-64 mx-auto" />
        <p className="text-sm font-mono text-white/40 mt-4 tracking-[0.2em] uppercase">
          AI/ML Engineer & Systems Builder
        </p>
      </motion.div>

      <AnimatePresence>
        {showHint && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex flex-col items-center gap-2">
              <span
                className={`text-sm font-mono text-accent tracking-[0.25em] uppercase ${
                  blink ? "opacity-100" : "opacity-0"
                }`}
                style={{ transition: "opacity 0.1s" }}
              >
                PRESS ENTER TO START
              </span>
              <div className="flex items-center gap-4 mt-6 text-[10px] font-mono text-white/20">
                <span>↑↓ NAVIGATE</span>
                <span className="w-1 h-1 bg-white/20 rounded-full" />
                <span>ENTER SELECT</span>
                <span className="w-1 h-1 bg-white/20 rounded-full" />
                <span>ESC BACK</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 right-8 text-[10px] font-mono text-white/15 tracking-wider text-right">
        <div>v{APP_VERSION}</div>
        <div>BUILD {BUILD_DATE}</div>
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)",
          mixBlendMode: "overlay",
        }}
      />
    </motion.div>
  );
};

export const TitleScreen: React.FC<TitleScreenProps> = ({ showBoot, onBootComplete, onStart }) => {
  const [bootDone, setBootDone] = useState(false);

  const handleBootComplete = () => {
    setBootDone(true);
    onBootComplete();
  };

  return (
    <>
      {showBoot && !bootDone && <BootSequence onComplete={handleBootComplete} />}
      <AnimatePresence>
        {bootDone && <TitleScreenComponent onStart={onStart} />}
      </AnimatePresence>
    </>
  );
};
