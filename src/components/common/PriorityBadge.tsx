import { ArrowDown, ArrowUp, ChevronsUp, Minus } from 'lucide-react';
import { PRIORITY_COLOR_VAR, PRIORITY_LABEL, type ComplaintPriority } from '@/lib/types';
import { cn } from '@/lib/utils';

const ICON = {
  low: ArrowDown,
  medium: Minus,
  high: ArrowUp,
  urgent: ChevronsUp,
} as const;

export function PriorityBadge({
  priority,
  className,
  showLabel = true,
}: {
  priority: ComplaintPriority;
  className?: string;
  showLabel?: boolean;
}) {
  const Icon = ICON[priority];
  const color = PRIORITY_COLOR_VAR[priority];
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
        className,
      )}
      style={{ color, backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)` }}
      title={`${PRIORITY_LABEL[priority]} priority`}
    >
      <Icon className="size-3" aria-hidden />
      {showLabel ? PRIORITY_LABEL[priority] : <span className="sr-only">{PRIORITY_LABEL[priority]}</span>}
    </span>
  );
}
