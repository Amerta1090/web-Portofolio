import { type ReactNode } from "react";

interface SplitTextProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  /** Delay per character in ms */
  charDelay?: number;
  /** Delay per word in ms */
  wordDelay?: number;
  /** Animation duration in ms per unit */
  duration?: number;
  /** Wraps each word, else each character */
  byWord?: boolean;
  children?: ReactNode;
}

/**
 * SplitText — wraps each character/word in a <span> for staggered animations.
 * Replace with gsap/SplitText or Framer Motion's staggerChildren when ready.
 *
 * Usage:
 *   <SplitText text="Hello World" byWord />
 *   // → <span><span class="split-word">Hello</span> <span class="split-word">World</span></span>
 */
export default function SplitText({
  text,
  as: Tag = "span",
  className = "",
  byWord = false,
  _charDelay,
  _wordDelay,
  _duration,
}: SplitTextProps & { _charDelay?: number; _wordDelay?: number; _duration?: number }) {
  if (byWord) {
    const words = text.split(" ");
    return (
      <Tag className={className} aria-label={text}>
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className="split-word inline-block"
            style={{ opacity: 0 }}
          >
            {word}
            {i < words.length - 1 && "\u00A0"}
          </span>
        ))}
      </Tag>
    );
  }

  const chars = text.split("");
  return (
    <Tag className={className} aria-label={text}>
      {chars.map((char, i) => (
        <span
          key={`${char}-${i}`}
          className="split-char inline-block"
          style={{ opacity: 0 }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </Tag>
  );
}
