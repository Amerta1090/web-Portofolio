import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  text: string;
  speed?: number;
  className?: string;
  cursor?: boolean;
  start?: boolean;
  onComplete?: () => void;
}

export default function TypewriterText({
  text,
  speed = 50,
  className = "",
  cursor = true,
  start = true,
  onComplete,
}: Props) {
  const prefersReduced = useReducedMotion();
  const [count, setCount] = useState(prefersReduced ? text.length : 0);
  const [done, setDone] = useState(prefersReduced);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (prefersReduced) {
      setCount(text.length);
      setDone(true);
      onCompleteRef.current?.();
      return;
    }

    if (!start) {
      clear();
      setCount(0);
      setDone(false);
      indexRef.current = 0;
      return;
    }

    indexRef.current = 0;
    setCount(0);
    setDone(false);

    function tick() {
      if (indexRef.current < text.length) {
        indexRef.current++;
        setCount(indexRef.current);
        timerRef.current = setTimeout(tick, speed);
      } else {
        setDone(true);
        onCompleteRef.current?.();
      }
    }

    timerRef.current = setTimeout(tick, speed);
    return clear;
  }, [text, speed, start, prefersReduced, clear]);

  return (
    <span className={className} aria-label={text}>
      {text.slice(0, count)}
      {cursor && !done && (
        <span
          className="inline-block w-[2px] h-[1em] bg-brand align-middle ml-px animate-pulse"
          aria-hidden="true"
        />
      )}
    </span>
  );
}
