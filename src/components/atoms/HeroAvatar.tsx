import { motion, useReducedMotion } from "framer-motion";
import { duration, easing } from "../../lib/motion";

interface HeroAvatarProps {
  className?: string;
  animate?: boolean;
}

export default function HeroAvatar({ className = "", animate = true }: HeroAvatarProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      className={`relative flex-shrink-0 ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={animate ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
      transition={{ ...easing["ease-spring-gentle"], stiffness: 100, damping: 15, delay: duration.slow }}
    >
      <svg viewBox="0 0 200 200" className="w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56">
        <defs>
          <clipPath id="avatar-clip">
            <polygon points="100,5 185,50 185,150 100,195 15,150 15,50" />
          </clipPath>
        </defs>
        {animate && !prefersReduced && (
          <motion.polygon
            points="100,5 185,50 185,150 100,195 15,150 15,50"
            fill="none"
            stroke="var(--color-brand)"
            strokeWidth="2"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
        )}
        <polygon
          points="100,10 180,52 180,148 100,190 20,148 20,52"
          fill="none"
          stroke="var(--color-brand-muted)"
          strokeWidth="1"
          opacity="0.4"
        />
        <image
          href="/images/profile/profile-400x500.webp"
          clipPath="url(#avatar-clip)"
          x="15"
          y="15"
          width="170"
          height="170"
          preserveAspectRatio="xMidYMid slice"
        />
      </svg>
    </motion.div>
  );
}
