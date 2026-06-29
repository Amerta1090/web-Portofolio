interface SplitTextProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  byWord?: boolean;
}

/**
 * SplitText — wraps each character/word in a <span> for staggered animations.
 * For animated reveals, use RevealText instead.
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
}: SplitTextProps) {
  if (byWord) {
    const words = text.split(" ");
    return (
      <Tag className={className} aria-label={text}>
        {words.map((word, i) => (
          <span key={`${word}-${i}`} className="split-word inline-block" style={{ opacity: 0 }}>
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
        <span key={`${char}-${i}`} className="split-char inline-block" style={{ opacity: 0 }}>
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </Tag>
  );
}
