import { motion, useInView, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import TypewriterText from "../components/atoms/TypewriterText";
import { gsap } from "../lib/gsap";
import { duration, easing } from "../lib/motion";
import type { GitHubData } from "../types/github";

interface Props {
  gitHubData: GitHubData;
  profileName: string;
  onComplete?: () => void;
}

const WINDOW_CONTROLS = ["#ff5f56", "#ffbd2e", "#27c93f"] as const;

export default function BootSequence({ gitHubData, profileName, onComplete }: Props) {
  const prefersReduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const glitchRef = useRef<HTMLSpanElement>(null);
  const onCompleteRef = useRef(onComplete);
  const currentLineRef = useRef(0);
  const isInView = useInView(sectionRef, { once: true, margin: "-64px" });
  const [phase, setPhase] = useState<"idle" | "typing" | "glitch" | "complete">("idle");
  const [currentLine, setCurrentLine] = useState(0);
  const [started, setStarted] = useState(false);
  const [skipped, setSkipped] = useState(false);

  onCompleteRef.current = onComplete;

  const lines = [
    "> INITIALIZING DEVELOPER PROFILE... OK",
    `> LOADING ${gitHubData.total_repos} REPOSITORIES... OK`,
    `> ${gitHubData.total_stars} STARS ACROSS PROJECTS... OK`,
    "> CALIBRATING CODE DNA... OK",
    `> ACCESS GRANTED. WELCOME, ${profileName.toUpperCase()}.`,
  ];

  useEffect(() => {
    try {
      if (localStorage.getItem("boot-sequence-seen") === "true") {
        setSkipped(true);
        onCompleteRef.current?.();
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (isInView && !skipped && phase === "idle") {
      setPhase("typing");
      const t = setTimeout(() => setStarted(true), 400);
      return () => clearTimeout(t);
    }
  }, [isInView, skipped, phase]);

  const handleLineComplete = useCallback(() => {
    if (currentLineRef.current < lines.length - 1) {
      currentLineRef.current++;
      setCurrentLine(currentLineRef.current);
    } else {
      setPhase("glitch");
    }
  }, [lines.length]);

  useEffect(() => {
    if (phase !== "glitch" || !glitchRef.current) return;
    if (prefersReduced) {
      setPhase("complete");
      onCompleteRef.current?.();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        try {
          localStorage.setItem("boot-sequence-seen", "true");
        } catch {}
        setPhase("complete");
        onCompleteRef.current?.();
      },
    });

    tl.to(glitchRef.current, {
      textShadow: "2px 0 #ff0000, -2px 0 #00ffff",
      duration: 0.05,
    })
      .to(glitchRef.current, {
        textShadow: "-2px 0 #ff0000, 2px 0 #00ffff",
        duration: 0.05,
      })
      .to(glitchRef.current, {
        textShadow: "3px 0 #ff0000, -3px 0 #00ffff",
        scale: 1.02,
        duration: 0.03,
      })
      .to(glitchRef.current, {
        textShadow: "0 0 transparent",
        scale: 1,
        duration: 0.1,
      })
      .to(glitchRef.current, {
        opacity: 0,
        duration: 0.02,
      })
      .to(glitchRef.current, {
        opacity: 1,
        duration: 0.05,
      })
      .to(glitchRef.current, {
        textShadow: "0 0 24px rgb(122 140 111 / 0.6)",
        duration: 0.5,
        ease: "power2.out",
      });

    return () => {
      tl.kill();
    };
  }, [phase, prefersReduced]);

  const handleSkip = useCallback(() => {
    if (phase === "complete" || skipped) return;
    try {
      localStorage.setItem("boot-sequence-seen", "true");
    } catch {}
    setSkipped(true);
    onCompleteRef.current?.();
  }, [phase, skipped]);

  useEffect(() => {
    if (skipped || phase === "complete") return;
    const handler = () => handleSkip();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [skipped, phase, handleSkip]);

  const showSkip = started && !skipped && phase !== "complete";

  if (skipped || prefersReduced) {
    return (
      <div ref={sectionRef} className="w-full py-8 md:py-12">
        <TerminalFrame>
          <div className="font-mono text-sm space-y-2">
            {lines.map((line) => (
              <div key={line} className="flex items-start gap-2">
                <span className="text-brand/50 shrink-0 mt-px">$</span>
                <span
                  className={line === lines[lines.length - 1] ? "text-brand" : "text-text-primary"}
                >
                  {line}
                </span>
              </div>
            ))}
          </div>
        </TerminalFrame>
      </div>
    );
  }

  return (
    <div
      ref={sectionRef}
      className="w-full py-8 md:py-12"
      onClick={handleSkip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleSkip();
      }}
    >
      <TerminalFrame>
        <motion.div
          className="font-mono text-sm space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: started ? 1 : 0 }}
          transition={{ duration: duration.normal, ease: easing["ease-out-expo"] }}
        >
          {lines.map((line, i) => {
            const isLast = i === lines.length - 1;
            const lineState =
              i < currentLine || (i === currentLine && phase === "complete")
                ? "done"
                : i > currentLine
                  ? "pending"
                  : phase === "typing"
                    ? "typing"
                    : phase === "glitch"
                      ? "glitch"
                      : "pending";

            return (
              <div key={line} className="flex items-start gap-2">
                <span className="text-brand/50 shrink-0 mt-px">$</span>
                {lineState === "typing" ? (
                  <TypewriterText text={line} speed={35} start onComplete={handleLineComplete} />
                ) : (
                  <span
                    ref={isLast ? glitchRef : undefined}
                    className={
                      lineState === "pending"
                        ? "text-text-secondary/30 select-none"
                        : isLast && phase === "complete"
                          ? "text-brand"
                          : "text-text-primary"
                    }
                  >
                    {lineState === "pending" ? line.replace(/\S/g, "\u00A0") : line}
                  </span>
                )}
              </div>
            );
          })}
        </motion.div>

        {showSkip && (
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: duration.normal }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSkip();
              }}
              className="text-[10px] text-text-secondary/30 hover:text-text-secondary/60 transition-colors font-mono tracking-wider bg-transparent border-none cursor-pointer"
            >
              Click anywhere or press any key to skip
            </button>
          </motion.div>
        )}
      </TerminalFrame>
    </div>
  );
}

function TerminalFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[640px] rounded-lg overflow-hidden border border-border bg-[#0a0a0a] shadow-lg shadow-black/20">
      <div className="flex items-center gap-2 px-4 py-3 bg-[#111111] border-b border-border">
        <div className="flex gap-1.5">
          {WINDOW_CONTROLS.map((color) => (
            <div key={color} className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          ))}
        </div>
        <div className="flex-1 text-center">
          <span className="text-[10px] text-text-secondary/30 font-mono tracking-wider">
            developer-terminal — bash
          </span>
        </div>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}
