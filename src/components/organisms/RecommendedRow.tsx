import { useRef } from "react";
import { cn } from "../../lib/utils";
import {
  useRecommendation,
  createViewTracker,
  type Recommendable,
} from "../../lib/recommend/useRecommendation";

export interface RecommendedRowProps {
  /** Candidate pool (all items that can be recommended). */
  items: Recommendable[];
  /** The item the visitor is currently exploring. */
  current: Recommendable;
  /** Optional icons (emoji/SVG) per item id, shown on cards. */
  icons?: Record<string, string>;
  /** How many cards to show (default 3). */
  limit?: number;
  /** Optional label override. */
  title?: string;
  className?: string;
  /** Called when a recommended card is opened. */
  onOpen?: (id: string) => void;
}

const FALLBACK_TITLE = "kamu jelajahi";

/**
 * "Karena kamu jelajahi X, coba Y" strip. Renders only once the visitor has
 * interacted (view/hover/click) with at least one item, so empty & disabled
 * states render nothing. Tracking accumulates into a deterministic liked
 * vector (persisted to localStorage) and ranking is pure cosine similarity.
 */
export function RecommendedRow({
  items,
  current,
  icons,
  limit = 3,
  title,
  className,
  onOpen,
}: RecommendedRowProps) {
  const { hasInteractions, track, recommend } = useRecommendation({ items });
  const trackRef = useRef(track);
  trackRef.current = track;

  const viewTrackerRef = useRef<ReturnType<typeof createViewTracker> | null>(null);
  if (viewTrackerRef.current === null) {
    viewTrackerRef.current = createViewTracker((id) => trackRef.current(id, "view"));
  }

  const observedFor = useRef<{ el: Element; id: string } | null>(null);
  const ref = (element: Element | null) => {
    if (!element) return;
    if (observedFor.current?.el === element && observedFor.current.id === current.id) return;
    observedFor.current = { el: element, id: current.id };
    viewTrackerRef.current?.(element, current.id);
  };

  const recommendations = hasInteractions
    ? recommend(current, { limit, historyWeight: 0.6, currentWeight: 0.4 })
    : [];

  if (
    !hasInteractions ||
    recommendations.length === 0 ||
    !recommendations.some(({ score }) => score > 0)
  ) {
    return null;
  }

  const currentLabel = current.title ?? FALLBACK_TITLE;
  const shownTitle = title ?? "Rekomendasi berdasarkan aktivitas";

  return (
    <section
      ref={ref}
      aria-label={shownTitle}
      className={cn("mt-10", className)}
    >
      <div className="mb-3 flex items-center gap-2">
        <p className="section-label text-text-secondary">
          Karena kamu jelajahi <span className="text-text-primary">{currentLabel}</span>, coba
          juga:
        </p>
        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-mono text-text-secondary">
          content-based · no LLM
        </span>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map(({ item, score }) => (
          <li key={item.id}>
            <button
              type="button"
              data-testid="recommendation-card"
              onClick={() => {
                track(item.id, "click");
                onOpen?.(item.id);
              }}
              onMouseEnter={() => track(item.id, "hover")}
              className={cn(
                "group flex h-full w-full flex-col gap-2 rounded-xl border border-border",
                "bg-surface-secondary p-4 text-left transition-colors",
                "hover:border-brand/60 hover:bg-surface-primary focus-visible:outline-2 focus-visible:outline-brand",
              )}
            >
              <span className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-text-secondary">
                {icons?.[item.id] ? <span aria-hidden="true">{icons[item.id]}</span> : null}
                {item.id}
              </span>
              <span className="text-sm text-text-primary group-hover:text-brand">
                {item.title ?? item.id}
              </span>
              {item.tags.length > 0 ? (
                <span className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-text-secondary"
                    >
                      {tag}
                    </span>
                  ))}
                </span>
              ) : null}
              <span className="mt-auto text-[10px] tabular-nums text-text-secondary/70">
                kemiripan {Math.round(score * 100)}%
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}