import { useScrollProgress } from "./useScrollProgress";

interface ParallaxOptions {
  speed?: number;
  offset?: number;
}

export function useParallax({ speed = 0.5, offset = 0 }: ParallaxOptions = {}) {
  const { scrollY, viewportHeight } = useScrollProgress();

  const y = (scrollY - offset) * speed;

  return {
    y,
    style: {
      transform: `translateY(${y}px)`,
      willChange: "transform",
    },
  };
}
