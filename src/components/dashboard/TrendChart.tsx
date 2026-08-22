import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import { trendLabel } from '@/lib/format';
import type { Stats } from '@/lib/types';

const SERIES = [
  { key: 'created' as const, label: 'Submitted', color: 'var(--chart-created)' },
  { key: 'resolved' as const, label: 'Resolved', color: 'var(--chart-resolved)' },
];

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-medium">{trendLabel(String(label))}</p>
      {payload.map((entry) => (
        <p key={String(entry.dataKey)} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            aria-hidden
            className="size-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {SERIES.find((s) => s.key === entry.dataKey)?.label}
          <span className="ml-auto font-medium tabular-nums text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

/** Thirty-day view of intake against throughput - the two lines share one axis. */
export function TrendChart({ trend }: { trend: Stats['trend'] }) {
  const isEmpty = trend.every((point) => point.created === 0 && point.resolved === 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4">
        {SERIES.map((series) => (
          <span key={series.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              aria-hidden
              className="h-0.5 w-4 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            {series.label}
          </span>
        ))}
      </div>

      {isEmpty ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No activity in the last 30 days
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={trendLabel}
              tickLine={false}
              axisLine={false}
              minTickGap={28}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={40}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            />
            <Tooltip
              content={(props) => <ChartTooltip {...props} />}
              cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
            />
            {SERIES.map((series) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                stroke={series.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
