import { lazy, Suspense, useEffect, useState } from "react";
import { useCapabilityStore } from "../lib/useCapabilityStore";
import { useExperienceTier, getEffectiveTier } from "../lib/useExperienceTier";

const LazyScene = lazy(() => import("./SceneContent"));

export default function AmbientScene() {
  const [mounted, setMounted] = useState(false);
  const initialize = useCapabilityStore((s) => s.initialize);
  const experienceTier = useCapabilityStore((s) => s.experienceTier);
  const initialized = useCapabilityStore((s) => s.initialized);
  const override = useExperienceTier((s) => s.override);

  useEffect(() => {
    setMounted(true);
    if (!initialized) initialize();
  }, [initialize, initialized]);

  const effectiveTier = getEffectiveTier(experienceTier, override);

  if (!mounted || effectiveTier !== "tier-3") return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <Suspense fallback={null}>
        <LazyScene />
      </Suspense>
    </div>
  );
}
