import { lazy, Suspense, useEffect, useState } from "react";

const LazyScene = lazy(() => import("./SceneContent"));

export default function AmbientScene() {
  const [mounted, setMounted] = useState(false);
  const [canRender, setCanRender] = useState(true);

  useEffect(() => {
    setMounted(true);
    try {
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (isMobile || prefersReduced) {
        setCanRender(false);
      }
    } catch {
      setCanRender(false);
    }
  }, []);

  if (!mounted || !canRender) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <Suspense fallback={null}>
        <LazyScene />
      </Suspense>
    </div>
  );
}
