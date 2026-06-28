import { useEffect, useRef, useState } from "react";

interface SectionInViewData {
  currentIndex: number;
  currentId: string | null;
  progress: number;
  sectionCount: number;
}

export function useSectionInView(sectionIds: string[]): SectionInViewData {
  const [data, setData] = useState<SectionInViewData>({
    currentIndex: 0,
    currentId: sectionIds[0] ?? null,
    progress: 0,
    sectionCount: sectionIds.length,
  });

  const entriesRef = useRef<Map<string, IntersectionObserverEntry>>(new Map());

  useEffect(() => {
    const entries = entriesRef.current;
    const observers: IntersectionObserver[] = [];

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (!el) continue;

      const observer = new IntersectionObserver(
        ([entry]) => {
          entries.set(id, entry);

          let bestId = sectionIds[0] ?? null;
          let bestRatio = 0;
          let bestProgress = 0;

          for (const sid of sectionIds) {
            const e = entries.get(sid);
            if (e && e.intersectionRatio > bestRatio) {
              bestRatio = e.intersectionRatio;
              bestId = sid;

              const rect = e.boundingClientRect;
              const parentRect = e.rootBounds ?? { top: 0, height: window.innerHeight };
              const offset = parentRect.top - rect.top;
              const sectionHeight = rect.height;
              const progress = sectionHeight > 0
                ? Math.max(0, Math.min(1, offset / sectionHeight))
                : 0;
              bestProgress = progress;
            }
          }

          setData({
            currentIndex: bestId ? sectionIds.indexOf(bestId) : 0,
            currentId: bestId,
            progress: bestProgress,
            sectionCount: sectionIds.length,
          });
        },
        { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] },
      );

      observer.observe(el);
      observers.push(observer);
    }

    return () => {
      for (const o of observers) o.disconnect();
      entries.clear();
    };
  }, [sectionIds]);

  return data;
}
