import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { duration, easing } from "./motion";

gsap.registerPlugin(ScrollTrigger);

gsap.defaults({
  ease: "power2.out",
  duration: duration.deliberate,
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
