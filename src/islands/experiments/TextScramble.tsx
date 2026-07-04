import { useState, useEffect, useRef, useCallback } from "react";

const PHRASES = [
  "Build the future.",
  "Code is poetry.",
  "Think different.",
  "Move fast, break things.",
  "Less is more.",
  "Stay hungry, stay foolish.",
  "Innovation distinguishes.",
  "Design is intelligence.",
  "Create without limits.",
  "Push the boundaries.",
];

const CHARS = "!<>-_\\/[]{}—=+*^?#________";

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

export default function TextScramble({ compact }: { compact?: boolean }) {
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [displayText, setDisplayText] = useState(PHRASES[0]);
  const [isGlitching, setIsGlitching] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  const scramble = useCallback((target: string) => {
    setIsGlitching(true);
    const length = target.length;
    let frame = 0;
    const totalFrames = compact ? 16 : 40;

    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      frame++;
      const progress = frame / totalFrames;
      const revealCount = Math.floor(progress * length);

      let result = "";
      for (let i = 0; i < length; i++) {
        if (i < revealCount) {
          result += target[i];
        } else {
          result += randomChar();
        }
      }

      if (frame >= totalFrames) {
        setDisplayText(target);
        setIsGlitching(false);
        clearInterval(intervalRef.current);
      } else {
        setDisplayText(result);
      }
    }, compact ? 80 : 40);
  }, [compact]);

  const nextPhrase = useCallback(() => {
    const next = (currentPhrase + 1) % PHRASES.length;
    setCurrentPhrase(next);
    scramble(PHRASES[next]);
  }, [currentPhrase, scramble]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!compact) return;

    nextPhrase();
    const autoTimer = setInterval(nextPhrase, 3000);
    return () => {
      clearInterval(autoTimer);
      clearInterval(intervalRef.current);
    };
  }, [nextPhrase, compact]);

  useEffect(() => {
    if (compact) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        nextPhrase();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      clearInterval(intervalRef.current);
    };
  }, [nextPhrase, compact]);

  if (compact) {
    return (
      <div
        ref={containerRef}
        className="w-full h-full bg-[#0a0a0c] flex items-center justify-center select-none overflow-hidden"
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 3px)",
            }}
          />
        </div>
        <span
          className={`text-lg font-black tracking-tight leading-none font-mono text-center px-4 ${
            isGlitching
              ? "text-amber-400 [text-shadow:1px_0_#ff0080,-1px_0_#00e5ff,0_0_10px_rgba(245,158,11,0.3)]"
              : "text-text-primary"
          }`}
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}
        >
          {displayText}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-[#0a0a0c] flex flex-col items-center justify-center select-none relative overflow-hidden"
      onClick={nextPhrase}
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 3px)",
          }}
        />
      </div>

      <div className="relative z-10 px-8 text-center">
        <div className="text-[10px] font-mono text-amber-500/50 mb-8 tracking-[0.3em] uppercase">
          &gt; Text Scramble Engine v2.0
        </div>

        <h1
          className={`text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-none font-mono transition-none ${
            isGlitching
              ? "text-amber-400 [text-shadow:2px_0_#ff0080,-2px_0_#00e5ff,0_0_20px_rgba(245,158,11,0.3)]"
              : "text-text-primary"
          }`}
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            ...(isGlitching
              ? {
                  animation: "glitch-skew 0.3s infinite linear alternate-reverse",
                }
              : {}),
          }}
        >
          {displayText.split("").map((char, i) => (
            <span
              key={i}
              className="inline-block"
              style={
                isGlitching && Math.random() > 0.95
                  ? {
                      transform: `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`,
                      opacity: Math.random() > 0.9 ? 0.5 : 1,
                    }
                  : {}
              }
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </h1>

        <div className="mt-12 flex items-center justify-center gap-4">
          <span className="text-xs font-mono text-text-secondary/40">
            [{currentPhrase + 1}/{PHRASES.length}]
          </span>
          <div className="flex gap-2">
            {PHRASES.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === currentPhrase
                    ? "bg-amber-400 w-4"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/5">
        <span className="text-[10px] text-text-secondary/40 font-mono">
          [SPACE/CLICK] to scramble
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
        <span className="text-[10px] text-text-secondary/40 font-mono">
          [ESC] to exit
        </span>
      </div>

      <style>{`
        @keyframes glitch-skew {
          0% { transform: skew(0deg); }
          20% { transform: skew(-1deg); }
          40% { transform: skew(0.5deg); }
          60% { transform: skew(-0.5deg); }
          80% { transform: skew(1deg); }
          100% { transform: skew(0deg); }
        }
      `}</style>
    </div>
  );
}
