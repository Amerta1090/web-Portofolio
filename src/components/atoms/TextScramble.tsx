import { useInView, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

interface TextScrambleProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  duration?: number;
  chars?: string;
  trigger?: "mount" | "scroll" | "hover" | "always";
  once?: boolean;
}

const DEFAULT_CHARS = "!<>-_\\/[]{}—=+*^?#$%@&";

function randomChar(chars: string): string {
  return chars[Math.floor(Math.random() * chars.length)];
}

export default function TextScramble({
  text,
  as: Tag = "span",
  className = "",
  duration: scrambleDuration = 1200,
  chars = DEFAULT_CHARS,
  trigger = "mount",
  once = true,
}: TextScrambleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-64px" });
  const prefersReduced = useReducedMotion();
  const [displayText, setDisplayText] = useState(trigger === "always" ? "" : text);
  const [scrambling, setScrambling] = useState(false);
  const frameRef = useRef<number>(0);

  const scramble = useCallback(() => {
    if (prefersReduced) {
      setDisplayText(text);
      return;
    }
    setScrambling(true);
    const start = performance.now();

    function update(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / scrambleDuration, 1);
      const revealCount = Math.floor(progress * text.length);

      let result = "";
      for (let i = 0; i < text.length; i++) {
        if (i < revealCount) {
          result += text[i];
        } else if (text[i] === " ") {
          result += " ";
        } else {
          result += randomChar(chars);
        }
      }
      setDisplayText(result);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(update);
      } else {
        setDisplayText(text);
        setScrambling(false);
      }
    }

    frameRef.current = requestAnimationFrame(update);
  }, [text, chars, scrambleDuration, prefersReduced]);

  useEffect(() => {
    if (trigger === "mount") {
      scramble();
    }
  }, [trigger, scramble]);

  useEffect(() => {
    if (trigger === "scroll" && isInView && !scrambling) {
      scramble();
    }
  }, [trigger, isInView, scramble, scrambling]);

  const handleMouseEnter = () => {
    if (trigger !== "hover") return;
    if (!scrambling) scramble();
  };

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  if (prefersReduced) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <div ref={ref}>
      <Tag
        className={className}
        onMouseEnter={handleMouseEnter}
        aria-label={text}
      >
        {displayText}
      </Tag>
    </div>
  );
}
