import { lazy, Suspense, useEffect, useState } from "react";
import { useCapabilityStore } from "../lib/useCapabilityStore";

const LazyScene = lazy(() => import("./SceneContent"));

export default function AmbientScene() {
  const [mounted, setMounted] = useState(false);
  const initialize = useCapabilityStore((s) => s.initialize);
  const isMobile = useCapabilityStore((s) => s.isMobile);
  const prefersReducedMotion = useCapabilityStore((s) => s.prefersReducedMotion);
  const initialized = useCapabilityStore((s) => s.initialized);

  useEffect(() => {
    setMounted(true);
    if (!initialized) initialize();
  }, [initialize, initialized]);

  const canRender = !isMobile && !prefersReducedMotion;

  if (!mounted || !canRender) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <Suspense fallback={null}>
        <LazyScene />
      </Suspense>
    </div>
  );
}
