import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A stat tile, not a chart: one number that answers one question. The optional
 * `tone` tints only the icon chip, so the number itself keeps text colour.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'neutral',
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: 'neutral' | 'primary' | 'warning' | 'danger' | 'success';
  className?: string;
}) {
  const toneColor = {
    neutral: 'var(--muted-foreground)',
    primary: 'var(--primary)',
    warning: 'var(--priority-medium)',
    danger: 'var(--destructive)',
    success: 'var(--status-resolved)',
  }[tone];

  return (
    <div className={cn('rounded-xl border border-border bg-card p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && (
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `color-mix(in oklab, ${toneColor} 12%, transparent)` }}
          >
            <Icon className="size-4" style={{ color: toneColor }} aria-hidden />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
