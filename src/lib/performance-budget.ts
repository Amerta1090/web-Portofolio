/**
 * Performance Budget — non-negotiable targets for the portfolio.
 *
 * Enforced during CI via Lighthouse CI and manual profiling.
 */

export const BUDGETS = {
  /** Lighthouse Performance score (mobile) */
  lighthousePerformance: 90,
  /** Lighthouse Accessibility score */
  lighthouseAccessibility: 95,
  /** First Contentful Paint in seconds */
  fcp: 1.5,
  /** Cumulative Layout Shift */
  cls: 0.05,
  /** Total JavaScript bundle size gzipped (in bytes) */
  bundleJsGzip: 300_000,
  /** Maximum time to interactive in seconds */
  tti: 3.0,
} as const;

/** Runtime budget check helper — logs warnings when exceeded */
export function checkPerformanceBudget(
  label: string,
  value: number,
  budget: number,
  unit = "ms",
): void {
  if (value > budget) {
    console.warn(`[Budget] ${label}: ${value}${unit} exceeds budget of ${budget}${unit}`);
  }
}
