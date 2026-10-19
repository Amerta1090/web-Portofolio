/**
 * Screen-reader data table for charts (Sprint 4, M4.7).
 *
 * Every SVG chart in `/observatory` and `/github` already exposes a generic
 * `aria-label` plus hover-only tooltips — nothing a screen reader or crawler
 * can read as *data*. This table carries the exact same rows the chart draws,
 * visually hidden but present in SSR HTML (islands server-render, so no-JS
 * readers get it too).
 *
 * M4.7.3: the caller maps the *same* array it renders into `rows` — never a
 * separately-maintained summary. e2e pins presence + same-content; unit pins
 * this component's structure once.
 *
 * M5.3.5: hidden with a `div.sr-only` *wrapper*, not `sr-only` on the `<table>`
 * itself. Tailwind's `sr-only` sets `width:1px; overflow:hidden`, but a table
 * box ignores both (`display:table` sizes to its content and does not clip), so
 * the table stayed 903px wide at 320px viewport and gave `/observatory` a real
 * 563px horizontal scroll (measured). The wrapper is a block box, so `width:1px`
 * + `overflow:hidden` clip it as written; the `data-chart-table` hook stays on
 * the table so existing selectors are unchanged.
 */
interface ChartDataTableProps {
  /** Stable hook for e2e (`data-chart-table="languages-radial"`). */
  id: string;
  caption: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}

export default function ChartDataTable({ id, caption, headers, rows }: ChartDataTableProps) {
  return (
    <div className="sr-only">
      <table data-chart-table={id}>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {headers.map((h) => (
              <th scope="col" key={h}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row[0])}>
              {row.map((cell, j) => (
                <td key={`${String(row[0])}-${j}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
