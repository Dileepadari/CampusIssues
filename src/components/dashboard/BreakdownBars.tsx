import { cn } from '@/lib/utils';

export type BreakdownRow = {
  key: string;
  label: string;
  value: number;
  /** A CSS colour. Status and priority rows pass their reserved token. */
  color?: string;
};

/**
 * Ranked magnitude comparison as a horizontal bar list. Every row is directly
 * labelled with its count and share, so identity never depends on colour, and
 * the whole thing reads as a table for a screen reader.
 */
export function BreakdownBars({
  rows,
  total,
  emptyLabel = 'Nothing to show yet',
  maxRows,
  className,
}: {
  rows: BreakdownRow[];
  total: number;
  emptyLabel?: string;
  maxRows?: number;
  className?: string;
}) {
  const visible = rows.filter((row) => row.value > 0).sort((a, b) => b.value - a.value);
  const shown = maxRows ? visible.slice(0, maxRows) : visible;
  const hidden = visible.length - shown.length;
  const peak = Math.max(1, ...shown.map((row) => row.value));

  if (!shown.length) {
    return <p className={cn('py-8 text-center text-sm text-muted-foreground', className)}>{emptyLabel}</p>;
  }

  return (
    <div className={className}>
      <table className="w-full">
        <caption className="sr-only">Breakdown by count</caption>
        <tbody>
          {shown.map((row) => {
            const share = total ? (row.value / total) * 100 : 0;
            const color = row.color ?? 'var(--primary)';
            return (
              <tr key={row.key} className="align-middle">
                <th
                  scope="row"
                  className="w-36 py-1.5 pr-3 text-left text-sm font-normal text-muted-foreground"
                >
                  <span className="block truncate" title={row.label}>
                    {row.label}
                  </span>
                </th>
                <td className="py-1.5">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{
                        width: `${(row.value / peak) * 100}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </td>
                <td className="w-24 py-1.5 pl-3 text-right text-sm tabular-nums">
                  <span className="font-medium">{row.value}</span>{' '}
                  <span className="text-xs text-muted-foreground">({share.toFixed(0)}%)</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {hidden > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {hidden} more {hidden === 1 ? 'category' : 'categories'} with fewer complaints
        </p>
      )}
    </div>
  );
}
