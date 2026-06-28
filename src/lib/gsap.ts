import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

gsap.defaults({
  ease: "power2.out",
  duration: 0.8,
});

export { gsap, ScrollTrigger };

export const gsapEasing = {
  "ease-out-expo": "power2.out",
  "ease-in-out": "power1.inOut",
  "ease-out-back": "back.out(1.7)",
  "ease-spring": "elastic.out(1, 0.3)",
} as const;

export const scrollTriggerDefaults: Partial<ScrollTrigger.StaticVars> = {
  markers: false,
};
